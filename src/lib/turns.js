const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { Player, globalEvents, world } = require("../wrapper/api");

/**
 * Player turn manager.
 */
class Turns {
    constructor() {
        this._turnOrder = false;
        this._currentTurn = false;
    }

    getTurnOrder() {
        if (!this._turnOrder) {
            this._turnOrder = world.TI4.getAllPlayerDesks();
        }
        return this._turnOrder;
    }

    setTurnOrder(playerDeskOrder, player) {
        assert(Array.isArray(playerDeskOrder));
        assert(!player || player instanceof Player);

        this._turnOrder = playerDeskOrder;

        // Tell world order changed.  First by message then by event.
        const colorOrder = this._turnOrder.map(
            (playerDesk) => playerDesk.colorName
        );
        const msg = locale("ui.message.turn_order", {
            turnOrder: colorOrder.join(", "),
        });
        Broadcast.chatAll(msg);

        // Tell any listeners, and set to be the first player's turn.
        globalEvents.TI4.onTurnOrderChanged.trigger(this._turnOrder, player);
        globalEvents.TI4.onTurnChanged.trigger(this._turnOrder[0], -1);
    }

    /**
     * Is it this player's turn?
     *
     * @param {Player} player
     * @returns {boolean}
     */
    static isActivePlayer(player) {
        // TODO XXX
        return true;
    }
}

module.exports = {
    Turns,
};
