const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);

    data.players.forEach((playerData) => {
        playerData.custodiansPoints = 0;
    });

    let custodians = undefined;
    const controlTokens = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "token:base/custodians") {
            custodians = obj;
        }
        if (ObjectNamespace.isControlToken(obj)) {
            controlTokens.push(obj);
        }
    }

    if (!custodians) {
        return;
    }

    controlTokens
        .filter((token) => {
            let pos = token.getPosition();
            pos = custodians.worldPositionToLocal(pos);
            return Math.abs(pos.x) < 2.5 && Math.abs(pos.y) < 2.5;
        })
        .forEach((token) => {
            const playerSlot = token.getOwningPlayerSlot();
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            const entry = playerDesk && data.players[playerDesk.index];
            if (entry) {
                entry.custodiansPoints += 1;
            }
        });
};
