require("../../../global"); // create world.TI4
const assert = require("assert");
const { UiSlice, TILE_W } = require("./ui-slice");

it("getSize", () => {
    const size = new UiSlice()
        .setShape(["<0,0,0>", "<1,0,-1>"]) // one north of anchor
        .setSlice([50])
        .getSize();
    assert.equal(size.w, Math.floor(TILE_W));
    assert.equal(size.h, Math.floor(TILE_W * 0.866 * 2));
});
