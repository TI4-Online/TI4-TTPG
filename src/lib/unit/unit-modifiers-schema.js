const Ajv = require("ajv")

const UNIT_MODIFIERS_SCHEMA = {
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
let _unitModifiersSchemaValidator = false

class UnitModifiersSchema {
    constructor() {
        throw new Error('Static only')
    }

    static validate(unit, onError) {
        if (!_unitModifiersSchemaValidator) {
            const ajv = new Ajv({useDefaults: true})
            _unitModifiersSchemaValidator = ajv.compile(UNIT_MODIFIERS_SCHEMA)
        }
        if (!_unitModifiersSchemaValidator(unit)) {
            (onError ? onError : console.error)(_unitModifiersSchemaValidator.errors)
            return false
        }
        return true
    }
}

module.exports.UnitModifiersSchema = UnitModifiersSchema
