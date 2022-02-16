//const faction = require("../faction/faction");
let technologyData = require("./technology.data");
const { Technology } = require("./technology");
const { PlayerDesk } = require("../player-desk");
const { MockGameObject, world } = require("../../wrapper/api");

const playerSlot = 1;
const desk = PlayerDesk.getPlayerDesks()[0];
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
        const getLength = (type) =>
            Technology.getTechnologiesOfType(type, playerSlot).length;

        expect(getLength("Blue")).toBe(6);
        expect(getLength("Red")).toBe(6);
        expect(getLength("Yellow")).toBe(6);
        expect(getLength("Green")).toBe(7);
        expect(getLength("unitUpgrade")).toBe(10);
    });
});
