const Ajv = require("ajv")

const UNIT_MODIFIER_SCHEMA = {
    type: "object",
    properties: {
        localeName: {type: "string"}, // human-readable name (after locale)
        localeDescription: {type: "string"}, // human-readable name (after locale)
        triggerNsid: {type: "string"}, // find in player area to apply this unit upgrade
        triggerNsids: {type: "array", items: {type: "string"}},
        owner: {type: "string"}, // self, opponent, or any
        priority: {type: "string"}, // mutate, adjust, or choose
        toggleActive: {type: "boolean"},
        isCombat: {type: "boolean"},  
    },
    required: ["localeName", "localeDescription", "owner", "priority"]
}

// Lazy instantiate on first use.
let _unitModifierSchemaValidator = false

class UnitModifierSchema {
    constructor() {
        throw new Error('Static only')
    }

    static validate(unit, onError) {
        if (!_unitModifierSchemaValidator) {
            const ajv = new Ajv({useDefaults: true})
            _unitModifierSchemaValidator = ajv.compile(UNIT_MODIFIER_SCHEMA)
        }
        if (!_unitModifierSchemaValidator(unit)) {
            (onError ? onError : console.error)(_unitModifierSchemaValidator.errors)
            return false
        }
        return true
    }
}

module.exports.UnitModifierSchema = UnitModifierSchema
