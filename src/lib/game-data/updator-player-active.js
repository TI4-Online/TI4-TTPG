const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.active = true;
    });

    for (const obj of world.TI4.turns.getAllStatusPads()) {
        const playerSlot = obj.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            continue;
        }

        const playerData = data.players[playerDesk.index];
        assert(playerData);

        assert(obj.__getPass);
        const active = !obj.__getPass();
        playerData.active = active;
    }
};
