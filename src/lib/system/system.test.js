const assert = require("../../wrapper/assert");
const { System, Planet } = require("./system");
const { Card, CardDetails } = require("../../wrapper/api");

it("static System.getByTile", () => {
    const mecatol = System.getByTile(18);
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
