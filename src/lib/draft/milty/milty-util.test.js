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
