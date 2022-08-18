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

// Only positions from the previous turn are kept.
// Disable this for now until memory pressue is understood.
const ADVANCE_TTPG_TURNS = false;

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
        this._isForward = true;
        this._isSnake = false;

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
        this._isForward = true;
        this._isSnake = false;
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

        // If the player count is wrong throw away the state.
        if (this._turnOrder.length != world.TI4.config.playerCount) {
            console.log("Turns._load: wrong count, resetting");
            this._turnOrder = world.TI4.getAllPlayerDesks();
            this._currentTurn = this._turnOrder[0];
        }
    }

    _maybeLoad() {
        if (this._needsLoad) {
            this._needsLoad = false;
            this._load();

            // This happens exactly once.
            const onChangedHandler = () => {
                this.setTurnOrder(
                    world.TI4.getAllPlayerDesks(),
                    undefined,
                    TURN_ORDER_TYPE.FORWARD
                );
            };
            globalEvents.TI4.onPlayerCountChanged.add(onChangedHandler);
            globalEvents.TI4.onGameSetup.add(onChangedHandler);
        }
    }

    invalidate() {
        this._needsLoad = true;
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
        if (!world.__isMock) {
            console.log(`Turns.setTurnOrder: ${msg} snake=${this._isSnake}`);
        }

        // Update persistent state *before* event.
        if (this._persistent) {
            this._save();
        }

        if (ADVANCE_TTPG_TURNS) {
            world.nextTurn();
        }

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

    /**
     * Read the next turn.  If `changeTurnInProgress` is true, also update
     * any internal state (e.g. snake changing direction) as part of reading
     * the next turn.
     *
     * @param {boolean} changeTurnInProgress
     * @returns
     */
    getNextTurn(changeTurnInProgress) {
        // Careful, the "current" player may have passed during their turn.
        const currentIdx = this._turnOrder.indexOf(this._currentTurn);
        if (currentIdx === -1) {
            console.log("getNextTurn: current turn not in list");
            return;
        }

        // Get passed players.  (Safter than getting active in case not using status pads)
        const passedPlayerSlots = new Set();
        for (const obj of this.getAllStatusPads()) {
            if (!obj.__getPass()) {
                continue; // active
            }
            const owningPlayerSlot = obj.getOwningPlayerSlot();
            assert(owningPlayerSlot >= 0);
            passedPlayerSlots.add(owningPlayerSlot);
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
                        if (changeTurnInProgress) {
                            this._isForward = !this._isForward;
                        }
                        dir = -dir;
                        // Continue leaving current candidate in place.
                    } else {
                        candidateIdx += dir;
                    }
                } else {
                    if (candidateIdx === 0) {
                        if (changeTurnInProgress) {
                            this._isForward = !this._isForward;
                        }
                        dir = -dir;
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
                return candidate;
            }
            remaining -= 1;
        }
    }

    setCurrentTurn(playerDesk, clickingPlayer) {
        this._maybeLoad();
        // playerDesk may be undefined
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        // It is legal to have the same player take two turns in a row
        // (e.g. snake draft changing direction).  Process set turn
        // for the current turn player as a new turn.

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
        for (const obj of this.getAllStatusPads()) {
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

        const next = this.getNextTurn(true);
        if (next) {
            this.setCurrentTurn(next, clickingPlayer);
            if (ADVANCE_TTPG_TURNS) {
                world.nextTurn();
            }
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

    /**
     * Have all players passed?
     *
     * @returns {boolean}
     */
    isTurnOrderEmpty() {
        return (
            this.getPassedPlayerSlotSet().size === world.TI4.config.playerCount
        );
    }

    getStatusPad(playerSlot) {
        assert(typeof playerSlot === "number");
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "pad:base/status") {
                continue;
            }
            if (obj.getOwningPlayerSlot() != playerSlot) {
                continue;
            }
            return obj;
        }
    }

    getAllStatusPads() {
        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "pad:base/status") {
                continue;
            }
            result.push(obj);
        }
        return result;
    }

    getPassed(playerSlot) {
        assert(typeof playerSlot === "number");
        const statusPad = this.getStatusPad(playerSlot);
        if (!statusPad) {
            return false;
        }
        return statusPad.__getPass();
    }

    setPassed(playerSlot, value) {
        assert(typeof playerSlot === "number");
        const statusPad = this.getStatusPad(playerSlot);
        if (!statusPad) {
            return;
        }
        if (statusPad.__getPass() === value) {
            return;
        }
        statusPad.__setPass(value);

        // Tell world.
        const clickingPlayer = undefined;
        globalEvents.TI4.onTurnPassedChanged.trigger(
            playerSlot,
            clickingPlayer
        );
    }

    clearAllPassed() {
        for (const statusPad of this.getAllStatusPads()) {
            if (statusPad.__getPass()) {
                statusPad.__setPass(false);
            }
        }

        // Tell world.
        const playerSlot = -1; // listener beware
        const clickingPlayer = undefined;
        globalEvents.TI4.onTurnPassedChanged.trigger(
            playerSlot,
            clickingPlayer
        );
    }

    getPassedPlayerSlotSet() {
        const passedPlayerSlotSet = new Set();
        for (const obj of this.getAllStatusPads()) {
            const playerSlot = obj.getOwningPlayerSlot();
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            if (!playerDesk) {
                continue;
            }
            if (obj.__getPass()) {
                passedPlayerSlotSet.add(playerSlot);
            }
        }
        return passedPlayerSlotSet;
    }
}

if (world.getExecutionReason() === "ScriptReload" && !world.__isMock) {
    process.nextTick(() => {
        const turns = world.TI4.turns;
        const order = turns.getTurnOrder().map((desk) => {
            return desk.colorName;
        });
        console.log(
            `Turn order: ${order.join(", ")}, forward=${
                turns._isForward
            }, snake=${turns._isSnake}`
        );
    });
}

module.exports = {
    Turns,
    TURN_ORDER_TYPE,
};
