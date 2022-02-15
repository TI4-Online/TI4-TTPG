const assert = require("assert");
const locale = require("../../lib/locale");
const { Faction } = require("./faction");
const { FactionSchema } = require("./faction.schema");
const { ObjectNamespace } = require("../object-namespace");
const { PlayerDesk } = require("../player-desk");
const { UnitAttrs } = require("../unit/unit-attrs");
const { FACTION_DATA } = require("./faction.data");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

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

it("FACTION_DATA starting units", () => {
    const allUnitTypes = UnitAttrs.getAllUnitTypes();
    FACTION_DATA.forEach((faction) => {
        Object.keys(faction.startingUnits).forEach((nsidName) => {
            assert(allUnitTypes.includes(nsidName));
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

it("static getByPlayerSlot", () => {
    world.__clear();
    const desk = PlayerDesk.getPlayerDesks()[0];
    const sheet = new MockGameObject({
        templateMetadata: "sheet.faction:base/arborec",
        position: desk.center,
    });
    assert(ObjectNamespace.isFactionSheet(sheet));
    world.__addObject(sheet);

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desk.playerSlot, player);

    const faction = Faction.getByPlayerSlot(desk.playerSlot);
    world.__clear();
    assert(faction);
    assert.equal(faction.raw.faction, "arborec");
});
