const assert = require("../wrapper/assert");
const { PlayerArea, DEFAULT_PLAYER_COUNT } = require("./player-area");

it("getPlayerDesks", () => {
    try {
        let playerDesks = PlayerArea.getPlayerDesks();
        assert.equal(playerDesks.length, DEFAULT_PLAYER_COUNT);

        for (let i = 2; i < 8; i++) {
            PlayerArea.setPlayerCount(i);
            playerDesks = PlayerArea.getPlayerDesks();
            assert.equal(playerDesks.length, i);
        }
    } finally {
        PlayerArea.setPlayerCount(DEFAULT_PLAYER_COUNT);
    }
});

it("getClosestSeat", () => {
    for (const playerDesk of PlayerArea.getPlayerDesks()) {
        const closestSeat = PlayerArea.getClosestSeat(playerDesk.pos);
        assert.equal(closestSeat, playerDesk.seat);
    }
});

it("getClosestPlayerSlot", () => {
    for (const playerDesk of PlayerArea.getPlayerDesks()) {
        const closestSlot = PlayerArea.getClosestPlayerSlot(playerDesk.pos);
        assert.equal(closestSlot, playerDesk.playerSlot);
    }
});
