const assert = require("assert");
const { ColorUtil } = require("./color-util");
const { MockColor } = require("../../wrapper/api");

it("colorFromHex", () => {
    const color = ColorUtil.colorFromHex("#010203");
    assert.equal(color.r, 1 / 255);
    assert.equal(color.g, 2 / 255);
    assert.equal(color.b, 3 / 255);
});

it("parse error", () => {
    assert.throws(() => {
        ColorUtil.colorFromHex("not_a_color");
    });
});

it("colorToHex", () => {
    const color = new MockColor(1 / 255, 2 / 255, 3 / 255);
    const hexColor = ColorUtil.colorToHex(color);
    assert.equal(hexColor, "#010203");
});
