/**
 * Very rare report that a player's card holder drops from being "theirs".
 * They can fix it by right clicking it and selecting "use as card holder"
 * but in the reported cases they didn't know that was an option.
 *
 * This script periodically checks and resets card holder assignments.
 */

const { ObjectNamespace } = require("../lib/object-namespace");
const { CardHolder, world } = require("../wrapper/api");

const PERIODIC_CHECK_SECONDS = 10;

function checkCardHolderAssignments() {
    for (const obj of world.getAllObjects()) {
        if (!(obj instanceof CardHolder)) {
            continue;
        }
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid !== "cardholder:base/large") {
            continue;
        }
        const playerSlot = obj.getOwningPlayerSlot();
        if (playerSlot < 0) {
            continue;
        }

        // At this point we have a card holder assigned to the player slot.
        const player = world.getPlayerBySlot(playerSlot);
        if (!player) {
            continue;
        }

        if (player.getHandHolder() !== obj) {
            player.setHandHolder(obj);
            const msg = `checkCardHolderAssignments: reset hand holder (slot ${playerSlot})`;
            console.log(msg);
            world.TI4.errorReporting.error(msg);
        }
    }
}

setInterval(() => {
    world.TI4.asyncTaskQueue.add(checkCardHolderAssignments);
}, PERIODIC_CHECK_SECONDS * 1000);
