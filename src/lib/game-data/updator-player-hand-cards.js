/**
 * CAREFUL, THIS EXPOSES SECRET INFORMATIN (cards in hand).
 * NOT INTENDED FOR NORMAL GAME-DATA USE!
 */
const assert = require("../../wrapper/assert-wrapper");
const { Card, world } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.handCards = [];
    });

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }

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
        const name = obj.getCardDetails().name;
        playerData.handCards.push(name);
    }
};
