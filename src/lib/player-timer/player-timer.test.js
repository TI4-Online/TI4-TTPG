require("../../global");
const assert = require("assert");
const {
    PlayerTimer,
    SAMPLE_EVERY_N_SECONDS,
    PHASE,
} = require("./player-timer");

it("getPlayerTimeSeconds", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    const phaseName = PHASE.ACTION;
    const round = 1;
    const result = playerTimer.getPlayerTimeSeconds(
        colorName,
        phaseName,
        round
    );
    assert.deepEqual(result, 0);
});

it("addSample", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    const phaseName = PHASE.ACTION;
    const round = 1;
    let result = playerTimer.getPlayerTimeSeconds(colorName, phaseName, round);
    assert.deepEqual(result, 0);

    playerTimer._addSample(colorName, phaseName, round);

    result = playerTimer.getPlayerTimeSeconds(colorName, phaseName, round);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
});

it("multiple rounds", () => {
    const playerTimer = new PlayerTimer();

    const colorName = "blue";
    const phaseName = PHASE.ACTION;
    let round = 1;
    playerTimer._addSample(colorName, phaseName, round);

    round = 2;
    playerTimer._addSample(colorName, phaseName, round);

    let result = playerTimer.getPlayerTimeSeconds(colorName, phaseName, 1);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
    result = playerTimer.getPlayerTimeSeconds(colorName, phaseName, 2);
    assert.deepEqual(result, SAMPLE_EVERY_N_SECONDS);
});

it("export", () => {
    const playerTimer = new PlayerTimer();

    let result = playerTimer.exportForGameData();
    assert.deepEqual(result, {});

    const colorName = "blue";
    const phaseName = PHASE.ACTION;
    let round = 1;
    playerTimer._addSample(colorName, phaseName, round);

    result = playerTimer.exportForGameData();
    assert.deepEqual(result, { blue: { action: { 1: 1 } } });
});
