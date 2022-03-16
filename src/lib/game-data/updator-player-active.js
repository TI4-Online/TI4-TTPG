const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.active = true;
    });

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid !== "pad:base/status") {
            continue;
        }
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
