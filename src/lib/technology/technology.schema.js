const Ajv = require("ajv");

const TECHNOLOGY_SCHEMA_JSON = {
    type: "object",
    properties: {
        localeName: { type: "string" }, // human-readable name (after locale)
        cardNsid: { type: "string" },
        type: { type: "string" }, // usually enum: ["Blue", "Green", "Yellow", "Red", "unitUpgrade"] },
        requirements: {
            type: "object",
            properties: {
                Blue: { type: "integer" },
                Green: { type: "integer" },
                Yellow: { type: "integer" },
                Red: { type: "integer" },
            },
        },
        abbrev: { type: "string" },
        faction: { type: "string" },
        source: { type: "string" },
        unitPosition: { type: "integer" },
    },
    required: ["localeName", "cardNsid", "type", "requirements", "abbrev"],
};

// Lazy instantiate on first use.
let _technologySchemaValidator = false;

/**
 * Static class for validating raw unit attributes against schema.
 */
class TechnologySchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} unit modifier
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(unit, onError) {
        if (!_technologySchemaValidator) {
            _technologySchemaValidator = new Ajv({
                useDefaults: true,
            }).compile(TECHNOLOGY_SCHEMA_JSON);
        }
        if (!_technologySchemaValidator(unit)) {
            (onError ? onError : console.error)(
                _technologySchemaValidator.errors
            );
            return false;
        }
        return true;
    }
}

module.exports = {
    TECHNOLOGY_SCHEMA_JSON,
    TechnologySchema,
};
