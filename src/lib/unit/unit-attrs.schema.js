const Ajv = require("ajv");

const UNIT_ATTRS_SCHEMA_JSON = {
    $id: "http://example.com/lib/unit/unit_attrs.json",
    type: "object",
    properties: {
        unit: { type: "string" }, // is or upgrades this base unit; simple name [a-z0-9_] (e.g. "war_sun")
        upgradeLevel: { type: "integer" }, // omit for base units, 1 for faction override, 2+ for unit upgrade
        localeName: { type: "string" }, // human-readable name (after locale)
        unitNsid: { type: "string" }, // plastic unit nsid, for finding units on table
        triggerNsid: { type: "string" }, // find in player area to apply this unit upgrade
        diceColor: {
            type: "object",
            properties: {
                r: { type: "number", minimum: 0, maximum: 1 },
                g: { type: "number", minimum: 0, maximum: 1 },
                b: { type: "number", minimum: 0, maximum: 1 },
            },
        },

        ship: { type: "boolean" },
        ground: { type: "boolean" },
        structure: { type: "boolean" },
        disablePlanetaryShield: { type: "boolean" },
        requireCapacity: { type: "boolean" },

        // Unit attrs can be unit modifiers, apply to all units in fight (e.g. flagship, homebrew)
        unitAbility: { type: "string" },

        // Unit abilities.
        sustainDamage: { type: "boolean" },
        antiFighterBarrage: {
            type: "object",
            properties: {
                dice: { type: "integer", default: 1 },
                hit: { type: "integer", maximum: 10 },
                extraDice: { type: "integer" },
                destroyInfantryInSpace: { type: "integer" },
                rerollMisses: { type: "boolean" },
            },
            required: ["hit"],
        },
        bombardment: {
            type: "object",
            properties: {
                dice: { type: "integer", default: 1 },
                hit: { type: "integer", maximum: 10 },
                extraDice: { type: "integer" },
                rerollMisses: { type: "boolean" },
            },
            required: ["hit"],
        },
        planetaryShield: { type: "boolean" },
        production: { type: "integer" }, // if negative use as R+ value (e.g. space dock 1 = -2)
        spaceCannon: {
            type: "object",
            properties: {
                dice: { type: "integer", default: 1 },
                hit: { type: "integer", maximum: 10 },
                range: { type: "integer" },
                extraDice: { type: "integer" },
                rerollMisses: { type: "boolean" },
            },
            required: ["hit"],
        },

        // Unit attributes.
        cost: { type: "integer" },
        produce: { type: "integer" }, // infantry cost=1 produce=2
        freeProduce: { type: "integer" }, // N do not count toward production limit
        sharedFreeProduce: { type: "integer" }, // N do not count toward production limit
        spaceCombat: {
            type: "object",
            properties: {
                dice: { type: "integer", default: 1 },
                hit: { type: "integer", maximum: 10 },
                requireSpace: { type: "boolean", default: true },
                extraHitsOn: {
                    // jol-nar flagship
                    type: "object",
                    properties: {
                        count: { type: "integer" },
                        value: { type: "integer", maximum: 10 },
                    },
                    required: ["count", "value"],
                },
                diceAsCount: { type: "boolean" }, // winnu flagship
            },
            required: ["hit"],
        },
        groundCombat: {
            type: "object",
            properties: {
                dice: { type: "integer", default: 1 },
                hit: { type: "integer", maximum: 10 },
                anyPlanet: { type: "boolean" },
                requireGround: { type: "boolean", default: true },
                extraHitsOn: {
                    // for homebrew
                    type: "object",
                    properties: {
                        count: { type: "integer" },
                        value: { type: "integer", maximum: 10 },
                    },
                    required: ["count", "value"],
                },
                extraDice: { type: "integer" },
            },
            required: ["hit"],
        },
        move: { type: "integer" },
        capacity: { type: "integer" },
    },
    required: ["unit", "localeName"],
};

// Lazy instantiate on first use.
let _unitAttrsValidator = false;

/**
 * Static class for validating raw unit attributes against schema.
 */
class UnitAttrsSchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} unit attributes
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(unit, onError) {
        if (!_unitAttrsValidator) {
            _unitAttrsValidator = new Ajv({ useDefaults: true }).compile(
                UNIT_ATTRS_SCHEMA_JSON
            );
        }
        if (!_unitAttrsValidator(unit)) {
            (onError ? onError : console.error)(_unitAttrsValidator.errors);
            return false;
        }
        return true;
    }
}

module.exports = {
    UNIT_ATTRS_SCHEMA_JSON,
    UnitAttrsSchema,
};
