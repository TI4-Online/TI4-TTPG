// the "it(string, function)" style works with mocha and jest frameworks
const assert = require("assert");
const { SystemSchema } = require("./system.schema");

it("validate good planet", () => {
    const jord = {
        tile: 1,
        source: "base",
        home: true,
        planets: [
            {
                localeName: "Jord",
                resources: 4,
                influence: 2,
            },
        ],
        img: "path/tile_001.png",
    };
    assert(SystemSchema.validate(jord));
});

it("validate system missing tile #", () => {
    const badJord = {
        source: "base",
        home: true,
        planets: [
            {
                localeName: "Jord",
                resources: 4,
                influence: 2,
            },
        ],
        img: "path/tile_001.png",
    };
    assert(!SystemSchema.validate(badJord, (err) => {}));
});

it("validate system with malformed planet", () => {
    const badJord = {
        tile: 1,
        source: "base",
        localeName: true,
        planets: [
            {
                localeName: "Jord",
                resources: "four",
                influence: 2,
            },
        ],
        img: "path/tile_001.png",
    };
    assert(!SystemSchema.validate(badJord, (err) => {}));
});

it("validate multiplanet system", () => {
    const maaluukDruaa = {
        tile: 9,
        source: "base",
        localeName: true,
        planets: [
            { localeName: "Maaluuk", resources: 0, influence: 2 },
            { localeName: "Druaa", resources: 3, influence: 1 },
        ],
        img: "path/tile_009.png",
    };
    assert(SystemSchema.validate(maaluukDruaa));
});
