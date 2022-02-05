const assert = require("../wrapper/assert");
const {
    PlayerArea,
    PlayerDesk,
    DEFAULT_PLAYER_COUNT,
} = require("./player-area");

it("getPlayerDesks", () => {
    try {
        let playerDesks = PlayerArea.getPlayerDesks();
        assert.equal(playerDesks.length, DEFAULT_PLAYER_COUNT);
        assert(playerDesks[0] instanceof PlayerDesk);

        for (let i = 2; i < 8; i++) {
            PlayerArea.setPlayerCount(i);
            playerDesks = PlayerArea.getPlayerDesks();
            assert.equal(playerDesks.length, i);
        }
    } finally {
        PlayerArea.setPlayerCount(DEFAULT_PLAYER_COUNT);
    }
});

it("getClosestPlayerDesk", () => {
    for (const playerDesk of PlayerArea.getPlayerDesks()) {
        const closestDesk = PlayerArea.getClosestPlayerDesk(playerDesk.pos);
        assert.equal(closestDesk, playerDesk);
    }
});

it("getClosestPlayerSlot", () => {
    for (const playerDesk of PlayerArea.getPlayerDesks()) {
        const closestSlot = PlayerArea.getClosestPlayerSlot(playerDesk.pos);
        assert.equal(closestSlot, playerDesk.playerSlot);
    }
});
