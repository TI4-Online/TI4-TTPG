require("../../../global"); // create world.TI4
const assert = require("assert");
const { UiFaction, BOX_W, BOX_H } = require("./ui-faction");

it("getSize", () => {
    const size = new UiFaction().setFactionNsidName("arborec").getSize();
    assert.equal(size.w, Math.ceil(BOX_W));
    assert.equal(size.h, Math.ceil(BOX_H));
});
