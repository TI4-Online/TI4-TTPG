const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { Player, globalEvents, world } = require("../wrapper/api");

/**
 * Player turn manager.
 */
class Turns {
    constructor() {
        this._turnOrder = undefined;
        this._currentTurn = undefined;
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
    }

    setCurrentTurn(playerDesk, player) {
        // playerDesk may be undefined
        assert(player instanceof Player);

        const prevTurn = this._currentTurn;
        this._currentTurn = playerDesk;
        globalEvents.TI4.onTurnChanged.trigger(
            this._currentTurn,
            prevTurn,
            player
        );

        Broadcast.broadcastAll(
            locale("ui.message.newTurn", {
                playerName: world.getPlayerBySlot(playerDesk._playerSlot) ? world.getPlayerBySlot(playerDesk._playerSlot).getName() : "<No Player Found>",
            }), playerDesk._color
        );
        console.log(world.getPlayerBySlot(playerDesk._playerSlot) ? world.getPlayerBySlot(playerDesk._playerSlot).getName() : "<No Player Found>");
    }

    endTurn(player){
        assert(player instanceof Player);

        if(!this._currentTurn || !(player.getSlot() == this._currentTurn._playerSlot)){
            return;
        }

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
            player.getSlot()
        );
        const color = playerDesk ? playerDesk.color : undefined;
        Broadcast.broadcastAll(
            locale("ui.message.end_turn", {
                playerName: player.getName(),
            }), color
        );

        var nextTurn = false;
        var nextPlayer = undefined;

        this._turnOrder.forEach((_playerDesk) => {
            if(nextTurn){
                console.log(_playerDesk.colorName)
                nextPlayer = _playerDesk;
            }
            if(_playerDesk.colorName == this._currentTurn._colorName){
                nextTurn = true;
            }
        });
        if(!nextPlayer){
            nextPlayer = this._turnOrder[0];
        }

        this.setCurrentTurn(nextPlayer, player);
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
