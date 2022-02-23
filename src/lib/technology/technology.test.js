require("../../global");
let technologyData = require("./technology.data");
const { Faction } = require("../faction/faction");

const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    world,
} = require("../../wrapper/api");

const { Technology } = require("./technology");
const { PlayerDesk } = require("../player-desk");

const player1 = new MockPlayer({ name: "one" });
const player2 = new MockPlayer({ name: "two" });
world.__setPlayers([player1, player2]);

world.TI4.config.setPlayerCount(2);
world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);

const playerSlot = 1;
const desk = PlayerDesk.getAllPlayerDesks()[0];
const sheet = new MockGameObject({
    templateMetadata: "sheet.faction:base/arborec",
    position: desk.center,
});
world.__addObject(sheet);

describe("getTechnologies", () => {
    it("without parameters", () => {
        const technologies = Technology.getTechnologies();
        expect(technologies.length).toBe(technologyData.length);
    });

    it("with a playerSlot", () => {
        jest.spyOn(Faction, "getByPlayerSlot").mockReturnValue({
            raw: { faction: "arborec" },
        });
        const technologies = Technology.getTechnologies(playerSlot);
        expect(technologies.length).toBe(37);
    });
});

describe("getTechnologiesByType", () => {
    it("without a playerSlot", () => {
        const technologies = Technology.getTechnologiesByType();
        expect(technologies.Blue.length).toBe(11);
        expect(technologies.Red.length).toBe(12);
        expect(technologies.Yellow.length).toBe(17);
        expect(technologies.Green.length).toBe(16);
        expect(technologies.unitUpgrade.length).toBe(23);
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
    it("without a type", () => {
        expect(Technology.getTechnologiesOfType).toThrowError();
    });

    it("without a playerSlot", () => {
        const getLength = (type) =>
            Technology.getTechnologiesOfType(type).length;

        expect(getLength("Blue")).toBe(11);
        expect(getLength("Red")).toBe(12);
        expect(getLength("Yellow")).toBe(17);
        expect(getLength("Green")).toBe(16);
        expect(getLength("unitUpgrade")).toBe(23);
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
    });

    it("without a player slot", () => {
        expect(Technology.getOwnedPlayerTechnologies).toThrowError();
    });

    it("without a playerSlot", () => {
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
    });
});
