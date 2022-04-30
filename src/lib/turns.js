const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("./saved-data/global-saved-data");
const { ObjectNamespace } = require("./object-namespace");
const { Player, globalEvents, world } = require("../wrapper/api");
const { Shuffle } = require("./shuffle");

const TURN_ORDER_TYPE = {
    FORWARD: 1,
    REVERSE: 2,
    SNAKE: 3,
};

/**
 * Player turn manager.
 */
class Turns {
    constructor(isPersistent) {
        assert(!isPersistent || typeof isPersistent === "boolean");
        this._turnOrder = [];
        this._currentTurn = undefined;
        this._isForward = undefined;
        this._isSnake = undefined;

        this._persistent = isPersistent ? true : false;
        this._needsLoad = true;

        // DO NOT LOAD SAVE STATE HERE.  Turns created before world.TI4 ready.
    }

    _save() {
        if (!this._persistent) {
            return;
        }
        const deskIndexArray = [];
        let currentTurnDeskIndex = -1;
        for (const playerDesk of this._turnOrder) {
            deskIndexArray.push(playerDesk.index);
            if (playerDesk === this._currentTurn) {
                currentTurnDeskIndex = playerDesk.index;
            }
        }
        const saveState = {
            o: deskIndexArray,
            c: currentTurnDeskIndex,
        };
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.TURNS, saveState);
    }

    _load() {
        // Load defaults.
        this._turnOrder = world.TI4.getAllPlayerDesks();
        this._currentTurn = this._turnOrder[0];

        if (!this._persistent) {
            return;
        }

        const saveState = GlobalSavedData.get(
            GLOBAL_SAVED_DATA_KEY.TURNS,
            false
        );
        if (!saveState) {
            return; // keep defaults
        }

        const deskIndexArray = saveState.o;
        const currentTurnDeskIndex = saveState.c;
        const playerDesks = world.TI4.getAllPlayerDesks();
        this._turnOrder = deskIndexArray.map((index) => {
            return playerDesks[index];
        });
        this._currentTurn = playerDesks[currentTurnDeskIndex]; // might be -1, fine
    }

    _maybeLoad() {
        if (this._needsLoad) {
            this._needsLoad = false;
            this._load();

            // This happens exactly once.
            const onChangedHandler = () => {
                this.setTurnOrder(world.TI4.getAllPlayerDesks(), undefined);
            };
            globalEvents.TI4.onPlayerCountChanged.add(onChangedHandler);
            globalEvents.TI4.onGameSetup.add(onChangedHandler);
        }
    }

    getTurnOrder() {
        this._maybeLoad();
        return this._turnOrder;
    }

    setTurnOrder(
        playerDeskOrder,
        player,
        turnOrderType = TURN_ORDER_TYPE.FORWARD
    ) {
        this._maybeLoad();
        assert(Array.isArray(playerDeskOrder));
        assert(!player || player instanceof Player);
        this._turnOrder = [...playerDeskOrder];
        this._currentTurn = this._turnOrder[0];

        this._isForward =
            turnOrderType === TURN_ORDER_TYPE.FORWARD ||
            turnOrderType === TURN_ORDER_TYPE.SNAKE;
        this._isSnake = turnOrderType === TURN_ORDER_TYPE.SNAKE;

        // Tell world order changed.  First by message then by event.
        const colorOrder = this._turnOrder.map(
            (playerDesk) => playerDesk.colorName
        );
        const msg = locale("ui.message.turn_order", {
            turnOrder: colorOrder.join(", "),
        });
        Broadcast.chatAll(msg);

        // Update persistent state *before* event.
        if (this._persistent) {
            this._save();
        }

        world.nextTurn();

        // Tell any listeners.
        globalEvents.TI4.onTurnOrderChanged.trigger(this._turnOrder, player);
    }

    randomizeTurnOrder(playerDesks, player, turnOrderType) {
        this._maybeLoad();
        assert(Array.isArray(playerDesks));
        assert(!player || player instanceof Player);

        let order = [...playerDesks];
        order = Shuffle.shuffle(order);
        this.setTurnOrder(order, player, turnOrderType);
    }

    getCurrentTurn() {
        this._maybeLoad();
        return this._currentTurn;
    }

    setCurrentTurn(playerDesk, clickingPlayer) {
        this._maybeLoad();
        // playerDesk may be undefined
        assert(!clickingPlayer || clickingPlayer instanceof Player);

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

        // Update state.
        const prevTurn = this._currentTurn;
        this._currentTurn = playerDesk;

        // Update persistent state *before* event.
        if (this._persistent) {
            this._save();
        }

        // Do this last, handlers may set turn! (active/passed)
        globalEvents.TI4.onTurnChanged.trigger(
            this._currentTurn,
            prevTurn,
            clickingPlayer
        );
    }

    /**
     * End the active player's turn, start the next player's turn.
     *
     * @param {Player} clickingPlayer
     */
    endTurn(clickingPlayer) {
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        this._maybeLoad();

        if (!this._currentTurn) {
            console.log("endTurn: no current turn");
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

        // Stop if all players have passed (with respect to current turn order).
        let anyActive = false;
        for (const candidate of this._turnOrder) {
            const candidateSlot = candidate.playerSlot;
            const isActive = !passedPlayerSlots.has(candidateSlot);
            if (isActive) {
                anyActive = true;
                break;
            }
        }
        if (!anyActive) {
            Broadcast.broadcastAll(
                locale("ui.message.all_players_have_passed")
            );
            globalEvents.TI4.onTurnOrderEmpty.trigger(clickingPlayer);
            return;
        }

        // Careful, the "current" player may have passed during their turn.
        const currentIdx = this._turnOrder.indexOf(this._currentTurn);
        if (currentIdx === -1) {
            console.log("endTurn: current turn not in list");
            return;
        }

        // Scan for next active, respecting order and snaking.
        // Set scan limit 2x size for snaking, harmless for normal.
        let dir = this._isForward ? 1 : -1;
        let candidateIdx = currentIdx;
        let remaining = this._turnOrder.length * 2;
        while (remaining > 0) {
            // Move to next.  If snaking, end slots get 2x turns.
            if (this._isSnake) {
                if (this._isForward) {
                    if (candidateIdx === this._turnOrder.length - 1) {
                        this._isForward = !this._isForward;
                        dir = this._isForward ? 1 : -1;
                        // Continue leaving current candidate in place.
                    } else {
                        candidateIdx += dir;
                    }
                } else {
                    if (candidateIdx === 0) {
                        this._isForward = !this._isForward;
                        dir = this._isForward ? 1 : -1;
                        // Continue leaving current candidate in place.
                    } else {
                        candidateIdx += dir;
                    }
                }
            } else {
                candidateIdx =
                    (candidateIdx + this._turnOrder.length + dir) %
                    this._turnOrder.length;
            }

            const candidate = this._turnOrder[candidateIdx];
            assert(candidate);
            const candidateSlot = candidate.playerSlot;
            const isActive = !passedPlayerSlots.has(candidateSlot);
            if (isActive) {
                this.setCurrentTurn(candidate, clickingPlayer);
                world.nextTurn();
                break;
            }
            remaining -= 1;
        }
    }

    /**
     * Is it this player's turn?
     *
     * @param {Player} player
     * @returns {boolean}
     */
    isActivePlayer(player) {
        this._maybeLoad();
        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        return this._currentTurn === playerDesk;
    }
}

module.exports = {
    Turns,
    TURN_ORDER_TYPE,
};
