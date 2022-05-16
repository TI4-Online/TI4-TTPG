require("../../global"); // register world.TI4
const assert = require("assert");
const { GameSetupConfig } = require("./game-setup-config");

it("playerCount", () => {
    const config = new GameSetupConfig();
    assert.equal(config.playerCount, 6);
    config.setPlayerCount(5);
    assert.equal(config.playerCount, 5);
});

it("gamePoints", () => {
    const config = new GameSetupConfig();
    assert.equal(config.gamePoints, 10);
    config.setGamePoints(12);
    assert.equal(config.gamePoints, 12);
});

it("pok", () => {
    const config = new GameSetupConfig();
    assert.equal(config.pok, true);
    config.setPoK(false);
    assert.equal(config.pok, false);
});

it("omega", () => {
    const config = new GameSetupConfig();
    assert.equal(config.omega, true);
    config.setOmega(false);
    assert.equal(config.omega, false);
});

it("codex1", () => {
    const config = new GameSetupConfig();
    assert.equal(config.codex1, true);
    config.setCodex1(false);
    assert.equal(config.codex1, false);
});

it("codex2", () => {
    const config = new GameSetupConfig();
    assert.equal(config.codex2, true);
    config.setCodex2(false);
    assert.equal(config.codex2, false);
});

it("codex3", () => {
    const config = new GameSetupConfig();
    assert.equal(config.codex3, true);
    config.setCodex3(false);
    assert.equal(config.codex3, false);
});

it("franken", () => {
    const config = new GameSetupConfig();
    assert.equal(config.franken, false);
    config.setFranken(true);
    assert.equal(config.franken, true);
});

it("timestamp", () => {
    const config = new GameSetupConfig();
    assert.equal(config.timestamp, 0);
    config.setTimestamp(120);
    assert.equal(config.timestamp, 120);
});
