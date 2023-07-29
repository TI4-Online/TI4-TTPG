require("../../../global");
const assert = require("assert");
const { AbstractUtil } = require("../abstract/abstract-util");
const { MiltySliceGenerator } = require("./milty-slice-generator");
const { world } = require("../../../wrapper/api");

it("constructor", () => {
    new MiltySliceGenerator();
});

it("generateSlices", () => {
    const count = world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const slices = sliceGenerator.generateSlices();
    AbstractUtil.assertIsSliceArray(slices, shape);
    assert.equal(slices.length, count);
});

it("verify unique", () => {
    const count = world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const TEST_ITERATIONS = 5;

    for (let i = 0; i < TEST_ITERATIONS; i++) {
        //console.log(`iteration ${i}`);

        const slices = sliceGenerator.generateSlices();
        AbstractUtil.assertIsSliceArray(slices, shape);

        const seen = new Set();
        for (const slice of slices) {
            for (const tile of slice) {
                assert(!seen.has(tile));
                seen.add(tile);
            }
        }
    }
});
