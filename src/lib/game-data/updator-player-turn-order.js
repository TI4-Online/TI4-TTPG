const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.turnOrder = -1;
    });

    const order = world.TI4.turns.getTurnOrder();
    order.forEach((playerDesk, index) => {
        const playerData = data.players[playerDesk.index];
        if (playerData) {
            playerData.turnOrder = index;
        }
    });
};
