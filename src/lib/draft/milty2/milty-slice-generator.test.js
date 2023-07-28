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
