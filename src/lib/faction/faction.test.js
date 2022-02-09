const assert = require("assert");
const { Faction } = require("./faction");
const { FactionSchema } = require("./faction.schema");
const { FACTION_DATA } = require("./faction.data");
const { UnitAttrs } = require("../unit/unit-attrs");

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

it("static getByNsidName", () => {
    const faction = Faction.getByNsidName("arborec");
    assert.equal(faction.raw.faction, "arborec");
});
