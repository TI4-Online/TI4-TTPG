const assert = require("../../wrapper/assert");
const { System, Planet } = require("./system");
const { Card, CardDetails, GameObject } = require("../../wrapper/api");

it("static System.getByTileNumber", () => {
    const mecatol = System.getByTileNumber(18);
    assert.equal(mecatol.tile, 18);
});

it("static System.getBySystemTileObject", () => {
    const obj = new GameObject({ templateMetadata: "tile.system:base/18" });
    const mecatol = System.getBySystemTileObject(obj);
    assert.equal(mecatol.tile, 18);
});

it("static Planet.getByPlanetCard", () => {
    const card = new Card({
        cardDetails: new CardDetails({
            metadata: "card.planet:base/mecatol_rex",
        }),
    });
    const planet = Planet.getByPlanetCard(card);
    assert.equal(planet.raw.localeName, "planet.mecatol_rex");
});

it("wormholes", () => {
    const system = System.getByTileNumber(26); // lodor
    assert.equal(system.wormholes.length, 1);
    assert.equal(system.wormholes[0], "alpha");
});
