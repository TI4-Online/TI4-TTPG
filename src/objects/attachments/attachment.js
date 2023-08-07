const assert = require("../../wrapper/assert-wrapper");
const { AttachmentSchema } = require("./attachment.schema");
const { ATTACHMENTS } = require("./attachment.data");
const { globalEvents } = require("../../wrapper/api");

let _cardNsidNameToAttachment = undefined;
let _tokenNsidNameToAttachment = undefined;

globalEvents.TI4.onGameSetup.add(() => {
    // setup may have changed PoK, Codex 3, etc.
    _cardNsidNameToAttachment = undefined;
    _tokenNsidNameToAttachment = undefined;
});

function _maybeInit() {
    if (!_cardNsidNameToAttachment) {
        _cardNsidNameToAttachment = {};
        _tokenNsidNameToAttachment = {};
        ATTACHMENTS.forEach((attachmentAttrs) => {
            const attachment = new Attachment(attachmentAttrs);
            _cardNsidNameToAttachment[attachment.raw.cardNsid] = attachment;
            _tokenNsidNameToAttachment[attachment.raw.tokenNsid] = attachment;
        });
    }
}

class Attachment {
    /**
     * Get all currently available attachments.
     *
     * @returns {Array.{Attachment}}
     */
    static getAllAttachments() {
        _maybeInit();
        return [...Object.values(_cardNsidNameToAttachment)];
    }

    static getByCardNsidName(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _cardNsidNameToAttachment[nsidName];
    }

    static getByTokenNsidName(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _tokenNsidNameToAttachment[nsidName];
    }

    static injectAttachment(attachmentAttrs) {
        assert(attachmentAttrs);
        AttachmentSchema.validate(attachmentAttrs, (err) => {
            throw new Error(
                `Attachment.injectAttachment schema error ${JSON.stringify(
                    err
                )}`
            );
        });
        assert(Array.isArray(ATTACHMENTS));
        ATTACHMENTS.push(attachmentAttrs);
        _cardNsidNameToAttachment = undefined;
        _tokenNsidNameToAttachment = undefined;

        console.log(
            `Attachment.injectAttachment: added "${attachmentAttrs.tokenNsid}"`
        );
    }

    constructor(attachmentAttrs) {
        this._attachmentAttrs = attachmentAttrs;
    }

    get raw() {
        return this._attachmentAttrs;
    }

    get localeName() {
        return this._attachmentAttrs.localeName;
    }

    get packageId() {
        return this._attachmentAttrs.packageId;
    }

    get cardNsid() {
        return this._attachmentAttrs.cardNsid;
    }

    get tokenNsid() {
        return this._attachmentAttrs.tokenNsid;
    }

    get faceUp() {
        return this._attachmentAttrs.faceUp;
    }

    get faceDown() {
        return this._attachmentAttrs.faceDown;
    }
}

module.exports = { Attachment };
