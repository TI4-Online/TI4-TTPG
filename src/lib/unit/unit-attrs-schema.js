const Ajv = require("ajv")

const UNIT_ATTRS_SCHEMA = {
    type: "object",
    properties: {
        unit: {type: "string"}, // is or upgrades this base unit; simple name [a-z0-9_] (e.g. "war_sun")
        level: {type: "number", default: 1},
        localeName: {type: "string"}, // human-readable name (after locale)
        unitNsid: {type: "string"}, // plastic unit nsid, for finding units on table
        triggerNsid: {type: "string"}, // find in player area to apply this unit upgrade

        ship: {type: "boolean"},
        structure: {type: "boolean"},

        // Unit abilities.
        sustainDamage: {type: "boolean"},
        antiFighterBarrage:{
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10}
            },
            required: ["hit"]
        },
        bombardment: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                extraDice: {type: "integer"}
            },
            required: ["hit"]
        },
        planetaryShield: {type: "boolean"},
        disablePlanetaryShield: {type: "boolean"},
        production: {type: "integer"}, // if negative use as R+ value (e.g. space dock 1 = -2)
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

        // Unit attributes.
        cost: {type: "integer"},
        produce: {type: "integer"}, // infantry cost=1 produce=2
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
        move: {type: "integer"},
        capacity: {type: "integer"},
    },
    required: ["unit", "localeName"]
}

// Lazy instantiate on first use.
let _unitAttrsValidator = false

class UnitAttrsSchema {
    constructor() {
        throw new Error('Static only')
    }

    static validate(unit, onError) {
        if (!_unitAttrsValidator) {
            const ajv = new Ajv({useDefaults: true})
            _unitAttrsValidator = ajv.compile(UNIT_ATTRS_SCHEMA)
        }
        if (!_unitAttrsValidator(unit)) {
            (onError ? onError : console.error)(_unitAttrsValidator.errors)
            return false
        }
        return true
    }
}

module.exports.UnitAttrsSchema = UnitAttrsSchema
