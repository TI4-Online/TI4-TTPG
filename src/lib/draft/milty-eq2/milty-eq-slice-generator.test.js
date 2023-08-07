require("../../../global");
const assert = require("assert");
const { MiltyEqSliceGenerator } = require("./milty-eq-slice-generator");

it("generateSlices", () => {
    const sliceCount = 7;
    const slices = new MiltyEqSliceGenerator().generateSlices(sliceCount);
    assert(Array.isArray(slices));
});
