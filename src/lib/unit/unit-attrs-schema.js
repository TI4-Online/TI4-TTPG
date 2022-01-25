const Ajv = require("ajv")

const UNIT_SCHEMA = {
    type: "object",
    properties: {
        localeName: {type: "string"}, // REQUIRED, unit and upgrades always have a name
        unitNsid: {type: "string"},
        triggerNsids: {
            type: "array", items: {type: "string"}
        },
        upgrade: {
            type: "object",
            properties: {
                unit: {type: "string"},
                level: {type: "integer"}
            },
            required: ["unit", "level"]
        },
        cost: {type: "integer"},
        produce: {type: "integer"},
        spaceCombat: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                requireSpace: {type: "boolean", default: true},
                extraHitsOn: { // jol-nar flagship
                    type: "object",
                    properties: {
                        count: {type: "integer"},
                        value: {type: "integer", maximum: 10}
                    },
                    required: ["count", "value"]
                },
                diceAsCount: {type: "boolean"} // winnu flagship
            },
            required: ["hit"]
        },
        move: {type: "integer"},
        capacity: {type: "integer"},
        ship: {type: "boolean"},
        sustainDamage: {type: "boolean"},
        bombardment: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                extraDice: {type: "integer"}
            },
            required: ["hit"]
        },
        groundCombat: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                anyPlanet: {type: "boolean"},
                requireGround: {type: "boolean", default: true}
            },
            required: ["hit"]
        },
        planetaryShield: {type: "boolean"},
        spaceConnon: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                range: {type: "integer"},
                extraDice: {type: "integer"}
            },
            required: ["hit"]
        },
        structure: {type: "boolean"},
        production: {type: "integer"},
        antiFighterBarrage:{
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10}
            },
            required: ["hit"]
        },
        disablePlanetaryShield: {type: "boolean"},
    },
    required: ["localeName"]
}

// Lazy instantiate on first use.
let _unitValidator = false

class UnitAttrsSchema {
    constructor() {
        throw new Error('Static only')
    }

    static validate(unit, onError) {
        if (!_unitValidator) {
            const ajv = new Ajv({useDefaults: true})
            _unitValidator = ajv.compile(UNIT_SCHEMA)
        }
        if (!_unitValidator(unit)) {
            (onError ? onError : console.error)(_unitValidator.errors)
            return false
        }
        return true
    }
}

module.exports.UnitAttrsSchema = UnitAttrsSchema
