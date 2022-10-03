require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const locale = require("../../lib/locale");
const { Faction } = require("./faction");
const { FactionSchema } = require("./faction.schema");
const { ObjectNamespace } = require("../object-namespace");
const { UnitAttrs } = require("../unit/unit-attrs");
const { FACTION_DATA } = require("./faction.data");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

it("FACTION_DATA schema", () => {
    FACTION_DATA.filter((faction) => !faction.merge).forEach((faction) => {
        if (!FactionSchema.validate(faction)) {
            console.log(`error for "${faction.faction}"`);
            assert(FactionSchema.validate(faction));
        }
    });
});

it("FACTION_DATA units", () => {
    FACTION_DATA.filter((faction) => !faction.merge).forEach((faction) => {
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
    FACTION_DATA.filter((faction) => !faction.merge).forEach((faction) => {
        Object.keys(faction.startingUnits).forEach((nsidName) => {
            assert(allUnitTypes.includes(nsidName));
        });
    });
});

it("FACTION_DATA faction locale", () => {
    FACTION_DATA.filter((faction) => !faction.abstract).forEach((faction) => {
        const abbrKey = "faction.abbr." + faction.faction;
        const abbr = locale(abbrKey);
        const fullKey = "faction.full." + faction.faction;
        const full = locale(fullKey);
        assert.notEqual(abbr, abbrKey);
        assert.notEqual(full, fullKey);
    });
});

it("static getByNsidName", () => {
    const faction = Faction.getByNsidName("arborec");
    assert.equal(faction.raw.faction, "arborec");
});

it("static getByNsidName (keleres)", () => {
    let faction = Faction.getByNsidName("keleres_argent");
    assert.equal(faction.raw.faction, "keleres_argent");

    faction = Faction.getByNsidName("keleres_mentak");
    assert.equal(faction.raw.faction, "keleres_mentak");

    faction = Faction.getByNsidName("keleres_xxcha");
    assert.equal(faction.raw.faction, "keleres_xxcha");

    faction = Faction.getByNsidName("keleres");
    assert.equal(faction, undefined);
});

it("static getByPlayerSlot", () => {
    world.__clear();
    const desk = world.TI4.getAllPlayerDesks()[0];
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

it("static inject", () => {
    assert(!Faction.getByNsidName("my_faction"));

    Faction.injectFaction({
        faction: "my_faction",
        source: "homebrew.unittest",
        abilities: [],
        commodities: 4,
        home: 18,
        leaders: {
            agents: [],
            commanders: [],
            heroes: [],
            mechs: [],
        },
        promissoryNotes: [],
        icon: "global/factions/my_faction.png",
        techs: [],
        units: [],
        startingTech: [],
        startingUnits: {},
    });

    // Test lookup by faction NSID.
    let faction = Faction.getByNsidName("my_faction");
    assert.equal(faction.raw.faction, "my_faction");

    world.__clear();
    const desk = world.TI4.getAllPlayerDesks()[0];
    const sheet = new MockGameObject({
        templateMetadata: "sheet.faction:homebrew/my_faction",
        position: desk.center,
    });
    world.__addObject(sheet);

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desk.playerSlot, player);

    // Test lookup by faction sheet in world.
    faction = Faction.getByPlayerSlot(desk.playerSlot);
    assert.equal(faction.raw.faction, "my_faction");
});

it("faction home nsid keleres", () => {
    const faction = Faction.getByNsidName("keleres_mentak");
    assert(faction);

    const homeNsid = faction.homeNsid;
    assert.equal(homeNsid, "tile.system:base/2");
});
