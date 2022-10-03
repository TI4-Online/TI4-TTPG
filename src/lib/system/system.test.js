require("../../global"); // create globalEvents.TI4
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
    world.__clear();
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/1" })
    );
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/2" })
    );
    const objs = System.getAllSystemTileObjects();
    const nsids = objs.map((obj) => ObjectNamespace.getNsid(obj));
    nsids.sort();
    world.__clear();
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

it("static Planet.getByCard", () => {
    const card = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.planet:base/mecatol_rex",
        }),
    });
    const planet = Planet.getByCard(card);
    assert.equal(planet.raw.localeName, "planet.mecatol_rex");
});

it("static Planet.getByCardNsid", () => {
    const planet = Planet.getByCardNsid("card.planet:base/mecatol_rex");
    assert.equal(planet.raw.localeName, "planet.mecatol_rex");
});

it("wormholes", () => {
    const system = System.getByTileNumber(26); // lodor
    assert.equal(system.wormholes.length, 1);
    assert.equal(system.wormholes[0], "alpha");
});

it("red/blue", () => {
    let system;

    system = System.getByTileNumber(47); // empty
    assert(system.red);
    assert(!system.blue);

    system = System.getByTileNumber(26); // lodor
    assert(!system.red);
    assert(system.blue);

    system = System.getByTileNumber(67); // cormund (rift)
    assert(system.red);
    assert(!system.blue);

    system = System.getByTileNumber(18); // mecatol
    assert(!system.red);
    assert(!system.blue);

    system = System.getByTileNumber(1); // home
    assert(!system.red);
    assert(!system.blue);

    system = System.getByTileNumber(90); // hyperlane
    assert(!system.red);
    assert(!system.blue);
});

it("summarize", () => {
    let tiles, summary;

    tiles = [25, 26, 27]; // quann, lodor, new albion
    summary = System.summarize(tiles);
    assert.equal(summary, "9/4 G αβ");

    tiles = [25];
    summary = System.summarize(tiles);
    assert.equal(summary, "2/1 β");

    tiles = [27];
    summary = System.summarize(tiles);
    assert.equal(summary, "4/2 G");
});

it("inject", () => {
    assert(!System.getByTileNumber(12349431));

    System.injectSystem({
        tile: 12349431,
        source: "homebrew",
        home: true,
        planets: [
            {
                localeName: "face_name",
                resources: 4,
                influence: 2,
            },
        ],
        img: "path/tile.png",
    });

    const system = System.getByTileNumber(12349431);
    assert.equal(system.tile, 12349431);
});
