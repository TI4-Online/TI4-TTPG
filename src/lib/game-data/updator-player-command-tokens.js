const assert = require("../../wrapper/assert-wrapper");
const { CommandToken } = require("../command-token/command-token");
const { world } = require("../../wrapper/api");

/**
 * "commandTokens":{
 *     "fleet":6,
 *     "tactics":0,
 *     "strategy":0
 *   },
 */
module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.commandTokens = {
            tactics: 0,
            fleet: 0,
            strategy: 0,
        };
    });

    const playerSlotToTokenCount = CommandToken.getPlayerSlotToTokenCount();
    for (const [playerSlotStr, tokenCount] of Object.entries(
        playerSlotToTokenCount
    )) {
        const playerSlot = Number.parseInt(playerSlotStr);
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            continue;
        }
        const playerData = data.players[playerDesk.index];
        assert(playerData);
        assert(tokenCount);
        assert(typeof tokenCount.tactics === "number");
        assert(typeof tokenCount.fleet === "number");
        assert(typeof tokenCount.strategy === "number");
        playerData.commandTokens = tokenCount;
    }
};
