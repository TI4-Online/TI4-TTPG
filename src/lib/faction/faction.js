const assert = require("../../wrapper/assert-wrapper");
const { FACTION_DATA } = require("./faction.data");

let _nsidNameToFaction = false;
function _maybeInit() {
    if (_nsidNameToFaction) {
        return; // already done
    }
    _nsidNameToFaction = {};
    FACTION_DATA.forEach((factionAttrs) => {
        const faction = new Faction(factionAttrs);
        _nsidNameToFaction[faction.raw.faction] = faction;
    });
}

class Faction {
    static getByPlayerSlot() {
        // TODO XXX
        return false;
    }

    static getByNsidName(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _nsidNameToFaction[nsidName];
    }

    constructor(factionAttrs) {
        this._factionAttrs = factionAttrs;
    }

    get raw() {
        return this._factionAttrs;
    }
}

module.exports = { Faction };
