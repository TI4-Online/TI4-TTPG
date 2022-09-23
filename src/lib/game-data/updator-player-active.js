const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.active = true;
    });

    const passedSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
    for (const playerSlot of passedSlotSet) {
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            continue;
        }
        const playerData = data.players[playerDesk.index];
        assert(playerData);
        playerData.active = false;
    }
};
