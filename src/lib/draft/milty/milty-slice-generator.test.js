require("../../../global"); // create world.TI4
const assert = require("assert");
const { MiltySliceGenerator } = require("./milty-slice-generator");

it("generate", () => {
    const sliceGenerator = new MiltySliceGenerator();
    const slices = sliceGenerator.generate();
    assert(sliceGenerator.getCount() > 0);
    assert.equal(slices.length, sliceGenerator.getCount());
});
