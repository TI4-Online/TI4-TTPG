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
            this._turnOrder = world.TI4.getAllPlayerDesks(); // NOT in constructor, world.TI4 not ready
            this._currentTurn = this._turnOrder[0];
        }
        return this._turnOrder;
    }

    setTurnOrder(playerDeskOrder, player) {
        assert(Array.isArray(playerDeskOrder));
        assert(!player || player instanceof Player);

        this._turnOrder = playerDeskOrder;
        this._currentTurn = this._turnOrder[0];

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

    getCurrentTurn() {
        return this._currentTurn;
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

    /**
     * End the active player's turn.
     *
     * @param {Player} clickingPlayer
     */
    endTurn(clickingPlayer) {
        assert(clickingPlayer instanceof Player);

        if (!this._currentTurn) {
            return;
        }

        const playerDesk = this._currentTurn;
        const playerSlot = playerDesk.playerSlot;
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

        // Get passed players.  (Safter than getting active in case not using status pads)
        const passedPlayerSlots = new Set();
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "pad:base/status") {
                continue;
            }
            if (!obj.__getPass()) {
                continue; // active
            }
            const owningPlayerSlot = obj.getOwningPlayerSlot();
            assert(owningPlayerSlot >= 0);
            passedPlayerSlots.add(owningPlayerSlot);
        }

        // Careful, the "current" player may have passed during their turn.
        let firstActive = undefined;
        let useNextActive = false;
        let nextActive = undefined;
        for (const candidate of this._turnOrder) {
            const candidateSlot = candidate.playerSlot;
            const isActive = !passedPlayerSlots.has(candidateSlot);
            if (!firstActive && isActive) {
                firstActive = candidate;
            }
            if (useNextActive && isActive) {
                useNextActive = false;
                nextActive = candidate;
            }
            if (candidate === this._currentTurn) {
                useNextActive = true;
            }
        }
        if (!nextActive) {
            nextActive = firstActive;
        }

        if (nextActive) {
            this.setCurrentTurn(nextActive, clickingPlayer);
        } else {
            Broadcast.broadcastAll(
                locale("ui.message.all_players_have_passed")
            );
        }
    }

    /**
     * Is it this player's turn?
     *
     * @param {Player} player
     * @returns {boolean}
     */
    isActivePlayer(player) {
        // TODO XXX
        return true;
    }
}

module.exports = {
    Turns,
};
