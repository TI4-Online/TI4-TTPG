require("../../global"); // create world.TI4
const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

// Some external tools use these "TTS Token Names" for factions.
// These probably belong in the faction definitions, but this
// lookaside is a reasonable interim solution.
const FACTION_NAME_TO_NSID_NAME = {
    "jol-nar": "jolnar",
    "n'orr": "norr",
    "naaz-rokha": "naazrokha",
    "vuil'raith": "vuilraith",

    // Other names
    sardakk: "norr",
    titans: "ul",
};

class FactionAliases {
    constructor() {
        throw new Error("static only");
    }

    static getNsid(alias) {
        assert(typeof alias === "string");
        alias = alias.toLowerCase();

        // Most are the same as the nsid name.
        if (world.TI4.getFactionByNsidName(alias)) {
            return alias;
        }

        // Not this one.  Check the lookaside table.
        const nsidName = FACTION_NAME_TO_NSID_NAME[alias];
        if (nsidName) {
            return nsidName;
        }

        if (!world.__isMock) {
            console.log(`FactionAliases.getNsid: unknown ${alias}`);
        }
        return false;
    }
}

module.exports = { FactionAliases };
