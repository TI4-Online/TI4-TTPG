const assert = require("assert");
const locale = require("../../lib/locale");
const { Faction } = require("./faction");
const { FactionSchema } = require("./faction.schema");
const { FACTION_DATA } = require("./faction.data");
const { UnitAttrs } = require("../unit/unit-attrs");

it("FACTION_DATA schema", () => {
    FACTION_DATA.forEach((faction) => {
        if (!FactionSchema.validate(faction)) {
            console.log(`error for "${faction.faction}"`);
            assert(FactionSchema.validate(faction));
        }
    });
});

it("FACTION_DATA units", () => {
    FACTION_DATA.forEach((faction) => {
        faction.units.forEach((nsidName) => {
            // Verify this is a known unit upgrade.
            // Units are overrides, mech, or flagship.
            const unitAttrs = UnitAttrs.getNsidNameUnitUpgrade(nsidName);
            if (!unitAttrs) {
                console.log(`error for "${nsidName}"`);
            }
            assert(unitAttrs);
        });
    });
});

it("FACTION_DATA faction locale", () => {
    FACTION_DATA.forEach((faction) => {
        const abbrKey = "faction.abbr." + faction.faction;
        const abbr = locale(abbrKey);
        const fullKey = "faction.full." + faction.faction;
        const full = locale(fullKey);
        assert(abbr !== abbrKey);
        assert(full !== fullKey);
    });
});

it("static getByNsidName", () => {
    const faction = Faction.getByNsidName("arborec");
    assert.equal(faction.raw.faction, "arborec");
});
