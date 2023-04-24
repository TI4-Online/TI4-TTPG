require("../../../global"); // create world.TI4
const assert = require("assert");
const { BunkerUtil } = require("./bunker-util");

it("parseSliceString", () => {
    const sliceString = "1 2 3 4";
    const parsed = BunkerUtil.parseSliceString(sliceString);
    assert.deepEqual(parsed, [1, 2, 3, 4]);
});

it("parseCustomConfig (simple slice)", () => {
    const sliceString = "1 2 3 4";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [[1, 2, 3, 4]]);
});

it("parseCustomConfig (simple slice with key)", () => {
    const sliceString = "slices=1 2 3 4";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [[1, 2, 3, 4]]);
});

it("parseCustomConfig (multiple slices)", () => {
    const sliceString = "1 2 3 4|6 7 8 9";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
});

it("parseCustomConfig (multiple slices with key)", () => {
    const sliceString = "slices=1 2 3 4|6 7 8 9";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
});

it("parseCustomConfig (labels)", () => {
    const sliceString = "1 2 3 4|6 7 8 9&labels=a|b";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.labels, ["a", "b"]);
});

it("parseCustomConfig (factions)", () => {
    const sliceString = "1 2 3 4|6 7 8 9&factions=arborec|ul";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.factions, ["arborec", "ul"]);
});

it("parseCustomConfig (factions with spaces)", () => {
    const sliceString = "1 2 3 4|6 7 8 9&factions=arborec | ul";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.factions, ["arborec", "ul"]);
});

it("parseCustomConfig (faction aliases)", () => {
    const sliceString =
        "1 2 3 4|6 7 8 9&factions=Jol-Nar|Naaz-Rokha|not-a-faction-name";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.factions, [
        "jolnar",
        "naazrokha",
        "not-a-faction-name",
    ]);
});

it("parseCustomConfig (no slice)", () => {
    const sliceString = "factions=Jol-Nar|Naaz-Rokha|not-a-faction-name";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert(!parsed.slices);
    assert.deepEqual(parsed.factions, [
        "jolnar",
        "naazrokha",
        "not-a-faction-name",
    ]);
});

it("parseCustomConfig (inner)", () => {
    const sliceString = "1 2 3 4|6 7 8 9&inner=10 11 12 13 14 15";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.inner, [10, 11, 12, 13, 14, 15]);
});

it("parseCustomConfig (eq)", () => {
    const sliceString = "1 2 3 4|6 7 8 9&eqs=10 11 12 13 14 15";
    const parsed = BunkerUtil.parseCustomConfig(sliceString);
    assert.deepEqual(parsed.slices, [
        [1, 2, 3, 4],
        [6, 7, 8, 9],
    ]);
    assert.deepEqual(parsed.inner, [10, 11, 12, 13, 14, 15]);
});
