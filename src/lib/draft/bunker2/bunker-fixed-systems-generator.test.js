require("../../../global");
const assert = require("assert");
const {
    BunkerFixedSystemsGenerator,
} = require("./bunker-fixed-systems-generator");

it("constructor", () => {
    new BunkerFixedSystemsGenerator();
});

it("generateFixedSystems", () => {
    const fixedCount = 6;
    const slices = [[1, 2, 3]];

    const fixedTiles = new BunkerFixedSystemsGenerator().generateFixedSystems(
        fixedCount,
        slices
    );
    assert(Array.isArray(fixedTiles));
    assert.equal(fixedTiles.length, fixedCount);
});
