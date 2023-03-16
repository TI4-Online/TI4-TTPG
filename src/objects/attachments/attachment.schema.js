const Ajv = require("ajv");

const ATTACHMENT_HELPER_SCHEMA = {
    type: "object",
    properties: {
        resources: { type: "number", default: 0 },
        influence: { type: "number", default: 0 },
        legendary: { type: "boolean", default: false },
        trait: {
            type: "array",
            items: { enum: ["cultural", "hazardous", "industrial"] },
        },
        tech: {
            type: "array",
            items: { enum: ["yellow", "red", "blue", "green"] },
        },
        image: { type: "string" },
    },
    required: ["image"],
};

const ATTACHMENT_SCHEMA = {
    type: "object",
    properties: {
        localeName: { type: "string" },
        cardNsid: { type: "string" },
        tokenNsid: { type: "string" },
        faceUp: ATTACHMENT_HELPER_SCHEMA,
        faceDown: ATTACHMENT_HELPER_SCHEMA,
    },
    required: ["localeName", "cardNsid", "tokenNsid", "faceUp"],
};

// Laxy instantiate on first use.
let _attachmentValidator = false;

/**
 * Static class for validating raw attachment against schema.
 */
class AttachmentSchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} attachment attributes
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(attachment, onError) {
        if (!_attachmentValidator) {
            _attachmentValidator = new Ajv({ useDefaults: true }).compile(
                ATTACHMENT_SCHEMA
            );
        }
        if (!_attachmentValidator(attachment)) {
            (onError ? onError : console.error)(_attachmentValidator.errors);
            return false;
        }
        return true;
    }
}

module.exports = { AttachmentSchema };
