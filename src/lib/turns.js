const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { Player, globalEvents, world } = require("../wrapper/api");
const { ObjectNamespace } = require("./object-namespace");

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

    setCurrentTurn(playerDesk, clickingPlayer) {
        // playerDesk may be undefined
        assert(clickingPlayer instanceof Player);

        const playerSlot = playerDesk.playerSlot;
        const currentTurnPlayer = world.getPlayerBySlot(playerSlot);
        let name = currentTurnPlayer && currentTurnPlayer.getName();
        if (!name || name.length === 0) {
            name = `<${playerDesk.colorName}>`;
        }
        Broadcast.broadcastAll(
            locale("ui.message.newTurn", {
                playerName: name,
            }),
            playerDesk._color
        );

        // Do this last, handlers may set turn! (active/passed)
        const prevTurn = this._currentTurn;
        this._currentTurn = playerDesk;
        globalEvents.TI4.onTurnChanged.trigger(
            this._currentTurn,
            prevTurn,
            clickingPlayer
        );
    }

    endTurn(playerSlot, clickingPlayer) {
        assert(typeof playerSlot === "number");
        assert(clickingPlayer instanceof Player);

        if (
            !this._currentTurn ||
            playerSlot !== this._currentTurn._playerSlot
        ) {
            return;
        }

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const player = world.getPlayerBySlot(playerSlot);
        let name = player && player.getName();
        if (!name || name.length === 0) {
            name = `<${playerDesk.colorName}>`;
        }
        const color = playerDesk ? playerDesk.color : undefined;
        Broadcast.broadcastAll(
            locale("ui.message.end_turn", {
                playerName: name,
            }),
            color
        );

        // Get active players.
        const activePlayerSlots = new Set();
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "pad:base/status") {
                continue;
            }
            if (obj.__isPass()) {
                continue;
            }
            const owningPlayerSlot = obj.getOwningPlayerSlot();
            assert(owningPlayerSlot >= 0);
            activePlayerSlots.add(owningPlayerSlot);
        }

        // Filter to active.
        const activeTurnOrder = this._turnOrder.filter((desk) => {
            return activePlayerSlots.has(desk.playerSlot);
        });
        if (activeTurnOrder.length === 0) {
            Broadcast.broadcastAll("ui.message.all_players_have_passed");
            return;
        }

        var nextTurn = false;
        var nextPlayer = undefined;

        activeTurnOrder.every((_playerDesk) => {
            if (nextTurn) {
                nextPlayer = _playerDesk;
                return false;
            }
            if (_playerDesk.colorName == this._currentTurn._colorName) {
                nextTurn = true;
            }
            return true;
        });
        if (!nextPlayer) {
            nextPlayer = activeTurnOrder[0];
        }

        this.setCurrentTurn(nextPlayer, clickingPlayer);
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
