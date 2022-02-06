const Ajv = require("ajv");

const UNIT_MODIFIER_SCHEMA_JSON = {
    $id: "http://example.com/lib/unit/unit_modifier.json",
    type: "object",
    properties: {
        localeName: { type: "string" }, // human-readable name (after locale)
        localeDescription: { type: "string" }, // human-readable name (after locale)
        triggerNsid: { type: "string" }, // find in player area to apply this unit upgrade
        triggerNsids: { type: "array", items: { type: "string" } },
        triggerFactionAbility: { type: "string" },
        triggerUnitAbility: { type: "string" },
        owner: { type: "string" }, // self, opponent, or any
        priority: { type: "string" }, // mutate, adjust, or choose
        toggleActive: { type: "boolean" },
        isCombat: { type: "boolean" },
    },
    required: ["localeName", "localeDescription", "owner", "priority"],
};

// Lazy instantiate on first use.
let _unitModifierSchemaValidator = false;

/**
 * Static class for validating raw unit attributes against schema.
 */
class UnitModifierSchema {
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
        // TODO XXX REMOVE THIS WHEN MACOS REQUIRE NODE_MODULES WORKS
        if (!Ajv) {
            //console.warn("Ajv not available");
            return true;
        }
        if (!_unitModifierSchemaValidator) {
            _unitModifierSchemaValidator = new Ajv({
                useDefaults: true,
            }).compile(UNIT_MODIFIER_SCHEMA_JSON);
        }
        if (!_unitModifierSchemaValidator(unit)) {
            (onError ? onError : console.error)(
                _unitModifierSchemaValidator.errors
            );
            return false;
        }
        return true;
    }
}

module.exports = {
    UNIT_MODIFIER_SCHEMA_JSON,
    UnitModifierSchema,
};
