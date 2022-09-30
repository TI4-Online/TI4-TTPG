const assert = require("../../wrapper/assert-wrapper");
const { Zone, world } = require("../../wrapper/api");

class AutoRollerArena {
    static rewriteArenaUnitHexes(unitPlastics) {
        assert(Array.isArray(unitPlastics));
    }

    static rewriteArenaUnitPlanets(unitPlastics) {
        assert(Array.isArray(unitPlastics));
    }

    static warpIn() {
        console.log("AutoRollerArena.warpIn");
    }

    static warpOut() {
        console.log("AutoRollerArena.warpOut");
    }
}

module.exports = { AutoRollerArena };
