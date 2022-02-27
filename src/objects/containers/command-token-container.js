const assert = require("../../wrapper/assert-wrapper");
const { refContainer, Container } = require("../../wrapper/api");
const {
    getRejectReason,
    REJECT_REASON,
} = require("../../global/patch-exclusive-bags");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Broadcast } = require("../../lib/broadcast");
const locale = require("../../lib/locale");

const DELAY = 3000; // delay in milliseconds before reporting

function holdsObject(container, object) {
    const containerName = ObjectNamespace.parseGeneric(container).name;
    const rejectReason = getRejectReason(container, object);

    // command token bags have name "*"
    // not sure if this is a bug from when they get spawned or caused by this script
    if (rejectReason === REJECT_REASON.MISMATCH_NAME && containerName === "*") {
        return true;
    }
    return !rejectReason;
}

function getFactionName(object) {
    // cant get the faction name from the container because the container has name "*"
    // therefore get it from the command token object
    assert(ObjectNamespace.isCommandToken(object));
    const factionName = ObjectNamespace.parseCommandToken(object).name;
    return locale("faction.full." + factionName);
}

class Reporter {
    constructor(container) {
        assert(container instanceof Container);
        this._container = container;

        // arrow functions necessary to get proper "this" value
        this._container.onInserted.add((container, objects) =>
            this.countInserted(container, objects)
        );
        this._container.onRemoved.add((container, object) =>
            this.countRemoved(container, object)
        );

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted(container, objects) {
        // ensure each inserted object belongs in the container before counting
        // it toward the number of inserted objects
        let addedValidObject = false;
        let factionName = null;
        for (const obj of objects) {
            if (!holdsObject(container, obj)) {
                continue;
            }
            this._insertedCounter++;
            addedValidObject = true;
            factionName = getFactionName(obj);
        }
        if (addedValidObject && !this._firstInserted) {
            this._firstInserted = true;
            setTimeout(() => {
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_inserted", {
                        factionName: factionName,
                        count: this._insertedCounter,
                    })
                );
                this._insertedCounter = 0;
                this._firstInserted = false;
            }, DELAY);
        }
    }

    countRemoved(container, object) {
        // ensure the object belongs in the container before counting it
        // towards the number of removed objects
        if (!holdsObject(container, object)) {
            return;
        }
        this._removedCounter++;
        if (!this._firstRemoved) {
            this._firstRemoved = true;
            setTimeout(() => {
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_removed", {
                        factionName: getFactionName(object),
                        count: this._removedCounter,
                    })
                );
                this._removedCounter = 0;
                this._firstRemoved = false;
            }, DELAY);
        }
    }
}

new Reporter(refContainer);
