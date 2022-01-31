// the "it(string, function)" style works with mocha and jest frameworks
const assert = require("assert");
const { SystemSchema } = require("./system.schema");

it("validate good planet", () => {
    const jord = {
        tile: 1,
        home: true,
        planets: [
            {
                localeName: "Jord",
                resources: 4,
                influence: 2,
            },
        ],
    };
    assert(SystemSchema.validate(jord));
});

it("validate system missing tile #", () => {
    const badJord = {
        home: true,
        planets: [
            {
                localeName: "Jord",
                resources: 4,
                influence: 2,
            },
        ],
    };
    assert(!SystemSchema.validate(badJord, (err) => {}));
});

it("validate system with malformed planet", () => {
    const badJord = {
        localeName: true,
        planets: [
            {
                localeName: "Jord",
                resources: "four",
                influence: 2,
            },
        ],
    };
    assert(!SystemSchema.validate(badJord, (err) => {}));
});

it("validate multiplanet system", () => {
    const maaluukDruaa = {
        tile: 9,
        localeName: true,
        planets: [
            { localeName: "Maaluuk", resources: 0, influence: 2 },
            { localeName: "Druaa", resources: 3, influence: 1 },
        ],
    };
    assert(SystemSchema.validate(maaluukDruaa));
});
