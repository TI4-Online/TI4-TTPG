require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { System, Planet, SYSTEM_TIER } = require("./system");
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

    tiles = [65];
    summary = System.summarize(tiles);
    assert.equal(summary, "2/1 L");

    // Optimal.
    tiles = [25];
    summary = System.summarize(tiles, true);
    assert.equal(summary, "2/1 (2/0) β");

    tiles = [27];
    summary = System.summarize(tiles, true);
    assert.equal(summary, "4/2 (3.5/0.5) G");

    tiles = [65];
    summary = System.summarize(tiles, true);
    assert.equal(summary, "2/1 (2/0) L");
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

it("legendary planets", () => {
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        const system = new System(systemAttrs);
        for (const planet of system.planets) {
            if (planet.raw.legendary) {
                const nsid = planet.raw.legendaryCard;
                const parsed = ObjectNamespace.parseNsid(nsid);
                assert.equal(parsed.type, "card.legendary_planet");
            }
        }
    });
});

it("calculateTier", () => {
    const low = [];
    const med = [];
    const high = [];
    const red = [];
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        const system = new System(systemAttrs);
        const tier = system.calculateTier();
        if (tier === SYSTEM_TIER.LOW) {
            low.push(system.tile);
        } else if (tier === SYSTEM_TIER.MED) {
            med.push(system.tile);
        } else if (tier === SYSTEM_TIER.HIGH) {
            high.push(system.tile);
        } else if (tier === SYSTEM_TIER.RED) {
            red.push(system.tile);
        }
    });
    low.sort();
    med.sort();
    high.sort();
    red.sort();

    assert.deepEqual(low, [19, 20, 21, 22, 23, 24, 25, 59, 60, 61, 62, 63]);
    assert.deepEqual(med, [28, 29, 30, 32, 33, 35, 36, 38, 69, 70, 71, 75]);
    assert.deepEqual(high, [26, 27, 31, 34, 37, 64, 65, 66, 72, 73, 74, 76]);
    assert.deepEqual(
        red,
        [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 67, 68, 77, 78, 79, 80]
    );
});

it("calculateOptimal", () => {
    // Check some full results.
    let system = System.getByTileNumber(18);
    let opt = system.calculateOptimal();
    assert.deepEqual(opt, { res: 1, inf: 6, optRes: 0, optInf: 6 });

    system = System.getByTileNumber(34); // gral is 1/1
    opt = system.calculateOptimal();
    assert.deepEqual(opt, { res: 2, inf: 4, optRes: 0.5, optInf: 3.5 });

    system = System.getByTileNumber(35);
    opt = system.calculateOptimal();
    assert.deepEqual(opt, { res: 5, inf: 4, optRes: 3, optInf: 3 });

    // Check just the optimals (lifted from miltydraft).
    const resu = {
        19: 0,
        20: 1,
        21: 0.5,
        22: 0.5,
        23: 1,
        24: 0,
        25: 2,
        26: 3,
        27: 3.5,
        28: 2,
        29: 0,
        30: 3,
        31: 3,
        32: 0.5,
        33: 2,
        34: 0.5,
        35: 3,
        36: 2,
        37: 0,
        38: 5,
        59: 0,
        60: 2,
        61: 2,
        62: 3,
        63: 0,
        64: 3,
        65: 2,
        66: 3,
        67: 2,
        68: 3,
        69: 0,
        70: 2,
        71: 3.5,
        72: 3,
        73: 0,
        74: 2,
        75: 3,
        76: 0.5,
    };
    const infu = {
        19: 2,
        20: 1,
        21: 0.5,
        22: 0.5,
        23: 1,
        24: 3,
        25: 0,
        26: 0,
        27: 0.5,
        28: 3,
        29: 5,
        30: 2,
        31: 0,
        32: 2.5,
        33: 2,
        34: 3.5,
        35: 3,
        36: 2,
        37: 6,
        38: 0,
        59: 3,
        60: 0,
        61: 0,
        62: 0,
        63: 2,
        64: 0,
        65: 0,
        66: 0,
        67: 0,
        68: 0,
        69: 6,
        70: 2,
        71: 0.5,
        72: 1,
        73: 3,
        74: 2,
        75: 2,
        76: 3.5,
    };

    for (let tile of Object.keys(resu)) {
        tile = Number.parseInt(tile);
        const system = System.getByTileNumber(tile);
        const opt = system.calculateOptimal();
        assert.equal(opt.optRes, resu[tile]);
        assert.equal(opt.optInf, infu[tile]);
    }
});
