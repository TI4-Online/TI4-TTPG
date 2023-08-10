const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { Card, world } = require("../../wrapper/api");

/**
 * handSummary:{"Promissory":4}
 */
const NSID_PREFIX_TO_EXPECTED_DECK_NAME = {
    "card.objective.secret": "Secret Objectives",
    "card.action": "Actions",
    "card.promissory": "Promissory",
};

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.handSummary = {};
    });

    const addNsid = (playerData, nsid) => {
        for (const [nsidPrefix, expectedDeckName] of Object.entries(
            NSID_PREFIX_TO_EXPECTED_DECK_NAME
        )) {
            if (nsid.startsWith(nsidPrefix)) {
                playerData.handSummary[expectedDeckName] =
                    (playerData.handSummary[expectedDeckName] || 0) + 1;
            }
        }
    };

    const skipContained = true;
    for (const obj of world.getAllObjects(skipContained)) {
        if (!(obj instanceof Card)) {
            continue;
        }
        if (obj.getStackSize() > 1) {
            continue;
        }
        const holder = obj.getHolder();
        if (!holder) {
            continue;
        }
        const playerSlot = holder.getOwningPlayerSlot();
        if (playerSlot < 0) {
            continue;
        }
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            continue;
        }

        // Card in a holder owned by player.
        const playerData = data.players[playerDesk.index];
        const nsid = ObjectNamespace.getNsid(obj);
        addNsid(playerData, nsid);
    }
};
