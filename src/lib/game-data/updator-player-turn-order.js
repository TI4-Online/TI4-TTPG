const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { FindTurnOrder } = require("../phase/find-turn-order");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.turnOrder = -1;
    });

    const order = FindTurnOrder.order();
    order.forEach((playerDesk, index) => {
        const playerData = data.players[playerDesk.index];
        if (playerData) {
            playerData.turnOrder = index;
        }
    });
};
