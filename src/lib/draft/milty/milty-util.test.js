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

it("parseCustomConfig (simple slice)", () => {
    const sliceString = "1 2 3 4 5";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [[1, 2, 3, 4, 5]]);
});

it("parseCustomConfig (multiple slices)", () => {
    const sliceString = "1 2 3 4 5|6 7 8 9 10";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
});

it("parseCustomConfig (labels)", () => {
    const sliceString = "1 2 3 4 5|6 7 8 9 10&labels=a|b";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    assert.deepEqual(parsed.labels, ["a", "b"]);
});

it("parseCustomConfig (factions)", () => {
    const sliceString = "1 2 3 4 5|6 7 8 9 10&factions=arborec|ul";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    assert.deepEqual(parsed.factions, ["arborec", "ul"]);
});

it("parseCustomConfig (factions with spaces)", () => {
    const sliceString = "1 2 3 4 5|6 7 8 9 10&factions=arborec | ul";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    assert.deepEqual(parsed.factions, ["arborec", "ul"]);
});

it("parseCustomConfig (faction aliases)", () => {
    const sliceString =
        "1 2 3 4 5|6 7 8 9 10&factions=Jol-Nar|Naaz-Rokha|not-a-faction-name";
    const parsed = MiltyUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);
    assert.deepEqual(parsed.factions, [
        "jolnar",
        "naazrokha",
        "not-a-faction-name",
    ]);
});
