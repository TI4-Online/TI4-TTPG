const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.steamName = "-";
    });

    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const playerSlot = playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        if (player) {
            data.players[playerDesk.index].steamName = player.getName();
        }
    }
};
