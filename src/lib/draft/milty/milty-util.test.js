require("../../../global"); // create world.TI4
const assert = require("assert");
const { MiltyUtil, DEFAULT_WRAP_AT } = require("./milty-util");

it("parseSliceString", () => {
    const sliceString = "1 2 3 4 5";
    const parsed = MiltyUtil.parseSliceString(sliceString);
    assert.deepEqual(parsed, [1, 2, 3, 4, 5]);
});

it("wrap", () => {
    const label = "test longer slice name";
    const wrapped = MiltyUtil.wrapSliceLabel(label, DEFAULT_WRAP_AT);
    assert.equal(wrapped, "test longer slice\nname");
});

it("parseCustomConfig", () => {
    let sliceString = "1 2 3 4 5";
    let parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [[1, 2, 3, 4, 5]]);

    sliceString = "1 2 3 4 5|6 7 8 9 10";
    parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    sliceString = "1 2 3 4 5|6 7 8 9 10&labels=a|b";
    parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    assert.deepEqual(parsed.labels, ["a", "b"]);
});
