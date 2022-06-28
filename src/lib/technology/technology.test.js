require("../../global");
const assert = require("assert");
const { Faction } = require("../faction/faction");
const { PlayerDesk } = require("../player-desk/player-desk");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

const TECHNOLOGY_DATA = require("./technology.data");
const { Technology } = require("./technology");
const { CardUtil } = require("../card/card-util");
const { TechnologySchema } = require("./technology.schema");

// Clear/reset a `jest.spyOn` leaves the function gutted.  Remember original.
const _faction_getByPlayerSlot = Faction.getByPlayerSlot;

const player1 = new MockPlayer({ name: "one" });
const player2 = new MockPlayer({ name: "two" });
world.__setPlayers([player1, player2]);

world.TI4.config.setPlayerCount(2);
world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);

const playerSlot = 1;
const desk = world.TI4.getAllPlayerDesks()[0];
const sheet = new MockGameObject({
    templateMetadata: "sheet.faction:base/arborec",
    position: desk.center,
});
world.__addObject(sheet);

it("TECHNOLOGY_DATA validate", () => {
    TECHNOLOGY_DATA.forEach((tech) => {
        if (!TechnologySchema.validate(tech)) {
            console.log(JSON.stringify(tech));
            assert(TechnologySchema.validate(tech));
        }
    });
});

describe("getTechnologies", () => {
    afterEach(() => {
        world.TI4.config.setPoK(true);
        world.TI4.config.setCodex3(true);
        jest.resetAllMocks();
    });

    it("without parameters and enabled PoK", () => {
        const technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(84);
    });

    it("with a playerSlot and enabled PoK", () => {
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });
        const technologies = Technology.getTechnologies(playerSlot);
        expect(technologies.length).toBe(35);
    });

    it("without parameters and disabled PoK", () => {
        world.TI4.config.setPoK(false);
        world.TI4.config.setCodex3(false);
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });
        const technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(60);
    });

    it("with a playerSlot and disabled PoK", () => {
        world.TI4.config.setPoK(false);
        world.TI4.config.setCodex3(false);
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });
        const technologies = Technology.getTechnologies(playerSlot);
        expect(technologies.length).toBe(27);
    });

    it("without parameters and switching PoK on, off and on again", () => {
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });

        let technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(84);

        world.TI4.config.setPoK(false);
        world.TI4.config.setCodex3(false);
        technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(60);

        world.TI4.config.setPoK(true);
        world.TI4.config.setCodex3(true);
        technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(84);
    });
});

describe("getTechnologiesByType", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("without a playerSlot", () => {
        const technologies = Technology.getTechnologiesByType();
        expect(technologies.Blue.length).toBe(11);
        expect(technologies.Red.length).toBe(12);
        expect(technologies.Yellow.length).toBe(19);
        expect(technologies.Green.length).toBe(16);
        expect(technologies.unitUpgrade.length).toBe(24);
    });

    it("with a playerSlot", () => {
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });

        const technologies = Technology.getTechnologiesByType(playerSlot);
        expect(technologies.Blue.length).toBe(6);
        expect(technologies.Red.length).toBe(6);
        expect(technologies.Yellow.length).toBe(6);
        expect(technologies.Green.length).toBe(7);
        expect(technologies.unitUpgrade.length).toBe(10);
    });
});

describe("getTechnologiesOfType", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("without a type", () => {
        expect(Technology.getTechnologiesOfType).toThrowError();
    });

    it("without a playerSlot", () => {
        const getLength = (type) =>
            Technology.getTechnologiesOfType(type).length;

        expect(getLength("Blue")).toBe(11);
        expect(getLength("Red")).toBe(12);
        expect(getLength("Yellow")).toBe(19);
        expect(getLength("Green")).toBe(16);
        expect(getLength("unitUpgrade")).toBe(24);
    });

    it("with a playerSlot", () => {
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });
        const getLength = (type) =>
            Technology.getTechnologiesOfType(type, playerSlot).length;

        expect(getLength("Blue")).toBe(6);
        expect(getLength("Red")).toBe(6);
        expect(getLength("Yellow")).toBe(6);
        expect(getLength("Green")).toBe(7);
        expect(getLength("unitUpgrade")).toBe(10);
    });
});

describe("getOwnedPlayerTechnologies", () => {
    afterEach(() => {
        world.__clear();
        jest.resetAllMocks();
    });

    it("without a player slot", () => {
        expect(Technology.getOwnedPlayerTechnologies).toThrowError();
    });

    it("with a playerSlot", () => {
        const _world_getAllObjects = world.getAllObjects;
        jest.spyOn(world, "getAllObjects").mockReturnValue([
            new MockCard({
                allCardDetails: [
                    new MockCardDetails({
                        metadata:
                            "card.technology.green:base/x89_bacterial_weapon.omega",
                    }),
                ],
            }),
            new MockCard({
                allCardDetails: [
                    new MockCardDetails({
                        metadata:
                            "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
                    }),
                ],
            }),
            new MockCard({
                allCardDetails: [
                    new MockCardDetails({
                        metadata: "card.technology.blue:pok/dark_energy_tap",
                    }),
                ],
            }),
        ]);

        const _PlayerDesk_getClosest = PlayerDesk.getClosest;
        jest.spyOn(PlayerDesk, "getClosest")
            .mockReturnValueOnce({ playerSlot: 1 })
            .mockReturnValueOnce({ playerSlot: 2 })
            .mockReturnValueOnce({ playerSlot: 1 });

        const ownedTechnologies =
            Technology.getOwnedPlayerTechnologies(playerSlot);

        expect(ownedTechnologies.length).toBe(2);
        expect(ownedTechnologies[0].cardNsid).toBe(
            "card.technology.green:base/x89_bacterial_weapon"
        );
        expect(ownedTechnologies[1].cardNsid).toBe(
            "card.technology.blue:pok/dark_energy_tap"
        );

        // spyOn does not restore original on reset/clear
        world.getAllObjects = _world_getAllObjects;
        PlayerDesk.getClosest = _PlayerDesk_getClosest;
    });
});

it("inject", () => {
    // Reset does not restore spyOn functions, manually reset with original.
    jest.resetAllMocks();
    Faction.getByPlayerSlot = _faction_getByPlayerSlot;

    Faction.injectFaction({
        faction: "homebrew_faction_name",
        source: "homebrew.foo",
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
        icon: "global/factions/homebrew_faction_name.png",
        techs: [],
        units: [],
        startingTech: [],
        startingUnits: {},
    });
    Technology.injectTechnology({
        localeName: "unit.infantry.homebrew_warrior_2",
        cardNsid:
            "card.technology.unit_upgrade.homebrew_faction_name:homebrew.foo/homebrew_warrior_2",
        type: "unitUpgrade",
        requirements: {
            Green: 1,
        },
        abbrev: "Homebrew II",
        faction: "homebrew_faction_name",
        unitPosition: 10,
    });

    world.__clear();
    const desk = world.TI4.getAllPlayerDesks()[1];
    const sheet = new MockGameObject({
        templateMetadata: "sheet.faction:homebrew.foo/homebrew_faction_name",
        position: desk.center,
    });
    world.__addObject(sheet);

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desk.playerSlot, player);

    // Make sure the faction applied.
    const faction = Faction.getByPlayerSlot(desk.playerSlot);
    assert.equal(faction.raw.faction, "homebrew_faction_name");
    assert.equal(faction.nsidName, "homebrew_faction_name");

    const techs = Technology.getTechnologies(desk.playerSlot);
    world.__clear();

    const localeNames = techs.map((tech) => {
        return tech.localeName;
    });
    assert(localeNames.includes("unit.infantry.homebrew_warrior_2"));
});
