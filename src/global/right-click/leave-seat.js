const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { PlayerDesk } = require("../../lib/player-desk/player-desk");
const { Player, globalEvents, world } = require("../../wrapper/api");

const ACTION_NAME = "*" + locale("ui.menu.leave_seat");

globalEvents.onCustomAction.add((player, identifier) => {
    assert(player instanceof Player);
    if (identifier === ACTION_NAME) {
        PlayerDesk.moveNewPlayerToNonSeatSlot(player);
    }
});

world.addCustomAction(ACTION_NAME);
