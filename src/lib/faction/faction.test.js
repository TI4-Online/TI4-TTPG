const assert = require("assert");
const { FactionSchema } = require("./faction.schema");
const { Spawn } = require("../../setup/spawn/spawn");
const { FACTION_DATA } = require("./faction.data");
const { UnitAttrs } = require("../unit/unit-attrs");

let _nsidSet = false;
function _assertNsid(nsid) {
    assert(typeof nsid === "string");
    if (!_nsidSet) {
        _nsidSet = new Set();
        Spawn.getAllNSIDs().forEach((nsid) => _nsidSet.add(nsid));
    }
    if (!_nsidSet.has(nsid)) {
        console.log(`bad NSID "${nsid}"`); // make failure easier to understand
    }
    assert(_nsidSet.has(nsid));
}

it("FACTION_DATA schema", () => {
    FACTION_DATA.forEach((faction) => {
        assert(FactionSchema.validate(faction));
    });
});

it("FACTION_DATA units", () => {
    FACTION_DATA.forEach((faction) => {
        faction.units.forEach((nsidName) => {
            // Verify this is a known unit upgrade.
            // Units are overrides, mech, or flagship.
            const unitAttrs = UnitAttrs.getNsidNameUnitUpgrade(nsidName);
            assert(unitAttrs);
        });
    });
});
