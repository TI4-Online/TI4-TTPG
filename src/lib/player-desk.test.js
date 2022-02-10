const assert = require("assert");
const { PlayerDesk, DEFAULT_PLAYER_COUNT } = require("./player-desk");
const { Color } = require("../wrapper/api");

it("static getPlayerDesks", () => {
    try {
        let playerDesks = PlayerDesk.getPlayerDesks();
        assert.equal(playerDesks.length, DEFAULT_PLAYER_COUNT);
        assert(playerDesks[0] instanceof PlayerDesk);

        for (let i = 2; i < 8; i++) {
            PlayerDesk.setPlayerCount(i);
            playerDesks = PlayerDesk.getPlayerDesks();
            assert.equal(playerDesks.length, i);
        }
    } finally {
        PlayerDesk.setPlayerCount(DEFAULT_PLAYER_COUNT);
    }
});

it("static getClosest", () => {
    for (const playerDesk of PlayerDesk.getPlayerDesks()) {
        const closestDesk = PlayerDesk.getClosest(playerDesk.pos);
        assert.equal(closestDesk, playerDesk);
    }
});

it("color", () => {
    const playerDesk = PlayerDesk.getPlayerDesks()[0];
    assert(typeof playerDesk.colorName === "string");
    assert(playerDesk.color instanceof Color);
});
