const assert = require("../wrapper/assert");
const { PlayerArea, DEFAULT_PLAYER_COUNT } = require("./player-area");

it("getPlayerDeskPosRots", () => {
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
