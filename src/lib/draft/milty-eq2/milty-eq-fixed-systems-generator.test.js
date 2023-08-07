require("../../../global");
const assert = require("assert");
const {
    MiltyEqFixedSystemsGenerator,
} = require("./milty-eq-fixed-systems-generator");

it("constructor", () => {
    new MiltyEqFixedSystemsGenerator();
});

it("generateFixedSystems", () => {
    const fixedCount = 6;
    const slices = [[1, 2, 3]];

    const fixedTiles = new MiltyEqFixedSystemsGenerator().generateFixedSystems(
        fixedCount,
        slices
    );
    assert(Array.isArray(fixedTiles));
    assert.equal(fixedTiles.length, fixedCount);
});
