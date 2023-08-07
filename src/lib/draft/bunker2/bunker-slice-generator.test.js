require("../../../global");
const assert = require("assert");
const { BunkerSliceGenerator } = require("./bunker-slice-generator");

it("generateSlices", () => {
    const sliceCount = 7;
    const slices = new BunkerSliceGenerator().generateSlices(sliceCount);
    assert(Array.isArray(slices));
});
