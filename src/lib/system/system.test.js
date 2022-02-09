const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { System, Planet } = require("./system");
const { SystemSchema } = require("./system.schema");
const { Card, CardDetails, GameObject } = require("../../wrapper/api");
const SYSTEM_ATTRS = require("./system.data");

it("SYSTEM_ATTRS validate", () => {
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        assert(SystemSchema.validate(systemAttrs));
    });
});

it("SYSTEM_ATTRS planet localeName", () => {
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        if (systemAttrs.planets) {
            systemAttrs.planets.forEach((planet) => {
                const name = locale(planet.localeName);
                if (name === planet.localeName) {
                    console.log(name); // log to make it easier to check
                }
                assert(name !== planet.localeName);
            });
        }
    });
});
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
