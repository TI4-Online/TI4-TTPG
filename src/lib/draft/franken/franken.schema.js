const Ajv = require("ajv");

const FACTION_ABILITY_SCHEMA = {
    type: "object",
    properties: {
        name: { type: "string" },
        nsidName: { type: "string" }, // optional, if lowercase + _ is not enough to compute
        description: { type: "string" },
        source: { type: "string" },
        mergeAbility: { type: "string" },
    },
    required: ["name", "description", "source"],
};

const UNDRAFTABLE_SCHEMA = {
    type: "object",
    properties: {
        name: { type: "string" },
        nsid: { type: "string" },
        count: { type: "number" },
        triggerAbility: { type: "string" },
        triggerNsid: { type: "string" },
        triggerNsids: { type: "array", items: { type: "string" } },
    },
    required: ["name", "nsid", "count"],
};

let _factionAbilityValidator = undefined;
let _undraftableValidator = undefined;

class FactionAbilitySchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} factionAbility
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(factionAbility, onError) {
        if (!_factionAbilityValidator) {
            _factionAbilityValidator = new Ajv({ useDefaults: true }).compile(
                FACTION_ABILITY_SCHEMA
            );
        }
        if (!_factionAbilityValidator(factionAbility)) {
            (onError ? onError : console.error)(
                _factionAbilityValidator.errors
            );
            return false;
        }
        return true;
    }
}

class UndraftableSchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} undraftable
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(undraftable, onError) {
        if (!_undraftableValidator) {
            _undraftableValidator = new Ajv({ useDefaults: true }).compile(
                UNDRAFTABLE_SCHEMA
            );
        }
        if (!_undraftableValidator(undraftable)) {
            (onError ? onError : console.error)(_undraftableValidator.errors);
            return false;
        }
        return true;
    }
}

module.exports = { FactionAbilitySchema, UndraftableSchema };
