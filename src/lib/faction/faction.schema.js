const Ajv = require("ajv");

const FACTION_SCHEMA = {
    type: "object",
    properties: {
        // Faction key and source, e.g. "jolnar" / "base".
        // Name and source of NSIDs ("card.faction_token:base/jolnar"),
        // Locale keys "faction.abbr.{x}" and "faction.full.{x}".
        faction: { type: "string" },
        source: { type: "string" },

        // Faction abilities, e.g. "fragile".
        // UnitModifier.triggerFactionAbility="{x}"
        // Locale key "faction.ability.{x}".
        abilities: { type: "array", items: { type: "string" } },

        commodities: { type: "integer" },
        home: { type: "integer" }, // home system tile index
        homeSurrogate: { type: "integer" }, // home off-map, tile in home pos

        leaders: {
            type: "object",
            properties: {
                agents: { type: "array", items: { type: "string" } },
                commanders: { type: "array", items: { type: "string" } },
                heroes: { type: "array", items: { type: "string" } },
            },
            required: ["agents", "commanders", "heroes"],
        },

        // Promissory notes e.g. "fires_of_the_gashlai".
        // Just NSID name ("card.promissory.muaat:base/fires_of_the_gashlai").
        promissoryNotes: { type: "array", items: { type: "string" } },

        // Faction tech, but not unit upgrades e.g. "magmus_reator".
        // Just NSID name ("card.technology.red.muaat:base/magmus_reator").
        techs: { type: "array", items: { type: "string" } },

        // Faction unit overrides/upgrades, e.g.["advanced_carrier", "advanced_carrier_2"].
        // Just NSID name ("card.technology.unit_upgrade.sol:base/advanced_carrier_2").
        // INCLUDES FLAGSHIP AND MECH!
        units: { type: "array", items: { type: "string" } },

        // Any special setup instructions (e.g. "choose 2 tech").
        startingMessage: { type: "string" },

        startingTech: {
            type: "array",
            items: { type: "string" }, // NSID names "plasma_scoring"
        },
        startingUnits: {
            type: "object",
            properties: {
                carrier: { type: "integer" },
                cruiser: { type: "integer" },
                destroyer: { type: "integer" },
                dreadnought: { type: "integer" },
                fighter: { type: "integer" },
                flagship: { type: "integer" },
                infantry: { type: "integer" },
                mech: { type: "integer" },
                pds: { type: "integer" },
                space_dock: { type: "integer" },
                war_sun: { type: "integer" },
            },
        },
        uppackExtra: {
            type: "object",
            properties: {
                tokenNsid: { type: "string" }, // "token.wormhole.creuss:base/alpha"
                tokenCount: { type: "integer" },
                bagNsid: { type: "string" }, // optinal, if given make token bag
                bagType: { type: "integer" },
            },
        },
    },
    required: [
        "faction",
        "abilities",
        "commodities",
        "home",
        "leaders",
        "units",
        "techs",
        "promissoryNotes",
        "startingTech",
        "startingUnits",
    ],
};

// Lazy instantiate on first use.
let _factionValidator = false;

/**
 * Static class for validating raw against schema.
 */
class FactionSchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} system attributes
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(faction, onError) {
        // TODO XXX REMOVE THIS WHEN MACOS REQUIRE NODE_MODULES WORKS
        if (!Ajv) {
            //console.warn("Ajv not available");
            return true;
        }
        if (!_factionValidator) {
            _factionValidator = new Ajv({ useDefaults: true }).compile(
                FACTION_SCHEMA
            );
        }
        if (!_factionValidator(faction)) {
            (onError ? onError : console.error)(_factionValidator.errors);
            return false;
        }
        return true;
    }
}

module.exports = {
    FactionSchema,
};
