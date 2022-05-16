const assert = require("../../wrapper/assert-wrapper");
const { Scoreboard } = require("../../lib/scoreboard/scoreboard");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.score = 0;
    });

    const scoreboard = Scoreboard.getScoreboard();
    if (!scoreboard) {
        return;
    }

    const playerSlotToScore = Scoreboard.getPlayerSlotToScore(scoreboard);
    for (const [playerSlotStr, score] of Object.entries(playerSlotToScore)) {
        const playerSlot = Number.parseInt(playerSlotStr);
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            //console.log(`updator-player-score: no desk for ${playerSlot}`);
            continue;
        }
        const playerData = data.players[playerDesk.index];
        assert(playerData);
        playerData.score = score;
    }
};
