require("../../global");
const assert = require("assert");
const { PlayerTimer, SAMPLE_EVERY_N_SECONDS } = require("./player-timer");
const { MockGameObject, world } = require("../../wrapper/api");

it("getPlayerTimeSeconds", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    const round = 1;
    const result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, 0);
});

it("addSample", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    const round = 1;
    let result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, 0);

    playerTimer._addSample(colorName, round);

    result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
});

it("multiple rounds", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    let round = 1;
    playerTimer._addSample(colorName, round);

    round = 2;
    playerTimer._addSample(colorName, round);

    let result = playerTimer.getPlayerTimeSeconds(colorName, 1);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
    result = playerTimer.getPlayerTimeSeconds(colorName, 2);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
});

it("export", () => {
    const playerTimer = new PlayerTimer();

    let result = playerTimer.exportForGameData();
    assert.deepEqual(result, {});

    const colorName = "blue";
    let round = 1;
    playerTimer._addSample(colorName, round);

    result = playerTimer.exportForGameData();
    assert.deepEqual(result, {
        blue: { 1: SAMPLE_EVERY_N_SECONDS },
    });
});

it("save/load", () => {
    const timer = new MockGameObject({ templateMetadata: "tool:base/timer" });

    let playerTimer = new PlayerTimer();

    const colorName = "blue";
    const round = 1;
    playerTimer._addSample(colorName, round);
    let result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);

    world.__clear();
    world.__addObject(timer);

    playerTimer._save();
    playerTimer = new PlayerTimer();
    result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, 0);

    playerTimer._load();
    result = playerTimer.getPlayerTimeSeconds(colorName, round);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);

    world.__clear();
});
