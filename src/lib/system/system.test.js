const assert = require("assert");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { System, Planet } = require("./system");
const { SystemSchema } = require("./system.schema");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");
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
    const obj = new MockGameObject({ templateMetadata: "tile.system:base/18" });
    const mecatol = System.getBySystemTileObject(obj);
    assert.equal(mecatol.tile, 18);
});
it("static System.getAllSystemTileObjects", () => {
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/1" })
    );
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/2" })
    );
    const objs = System.getAllSystemTileObjects();
    world.__clear();
    const nsids = objs.map((obj) => ObjectNamespace.getNsid(obj));
    nsids.sort();
    assert.deepEqual(nsids, ["tile.system:base/1", "tile.system:base/2"]);
});

it("static getActiveSystemTileObject", () => {
    const mecatolObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const player = new MockPlayer();
    globalEvents.TI4.onSystemActivated.trigger(mecatolObj, player);
    const activeObj = System.getActiveSystemTileObject();
    assert.equal(activeObj, mecatolObj);
});

it("static Planet.getByPlanetCard", () => {
    const card = new MockCard({
        cardDetails: new MockCardDetails({
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
