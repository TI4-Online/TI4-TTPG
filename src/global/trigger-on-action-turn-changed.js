const { globalEvents, world } = require("../wrapper/api");
const { FindTurnOrder } = require("../lib/phase/find-turn-order");
const gameDataRound = require("../lib/game-data/updator-round");
const assert = require("../wrapper/assert-wrapper");

/**
 * Trigger onActionTurnChanged when the active player changes
 * during the action phase.  Send playerSlot=-1 when not in
 * action phase or timer is paused.
 *
 * Triggers the event on the second tick to seed any listeners.
 */

// Round number when all players passed.
let _allPassedRound = 0;
let _note = "";

const VERBOSE = true;

function getRound() {
    const gameData = {};
    gameDataRound(gameData);
    assert(gameData.round !== undefined);
    return gameData.round;
}

function isAllPassedRound() {
    return getRound() <= _allPassedRound;
}

function isActionPhase() {
    const numPickedStrategyCards = FindTurnOrder.numPickedStrategyCards();
    return numPickedStrategyCards === world.TI4.config.playerCount;
}

function isTimerPaused() {
    const timer = world.TI4.getTimer();
    return timer && timer.__timer && timer.__timer.getDirection() === 0;
}

function getCurrentPlayerSlot() {
    if (isAllPassedRound()) {
        _note = "Waiting for next action phase";
        if (VERBOSE) {
            console.log(
                "export-current-turn getCurrentPlayerSlot: not action phase (round)"
            );
        }
        return -1;
    }
    if (!isActionPhase()) {
        _note = "Waiting for all players to pick strategy cards";
        if (VERBOSE) {
            console.log(
                "export-current-turn getCurrentPlayerSlot: not action phase (strategy cards)"
            );
        }
        return -1;
    }
    if (isTimerPaused()) {
        _note = "Timer paused";
        if (VERBOSE) {
            console.log(
                "export-current-turn getCurrentPlayerSlot: timer paused"
            );
        }
        return -1;
    }
    _note = "";

    const currentPlayerSlot =
        world.TI4.turns.getCurrentTurn()?.playerSlot ?? -1;
    if (VERBOSE) {
        const name = world.TI4.getNameByPlayerSlot(currentPlayerSlot);
        console.log(
            `export-current-turn getCurrentPlayerSlot: ${currentPlayerSlot} (${name})`
        );
    }
    return currentPlayerSlot;
}

function triggerOnActionTurnChanged() {
    const playerSlot = getCurrentPlayerSlot();
    globalEvents.TI4.onActionTurnChanged.trigger(playerSlot, _note);
}

globalEvents.TI4.onTimerToggled.add(() => {
    if (VERBOSE) {
        console.log("export-current-turn onTimerToggled");
    }
    triggerOnActionTurnChanged();
});

globalEvents.TI4.onTurnChanged.add(() => {
    if (VERBOSE) {
        console.log("export-current-turn onTurnChanged");
    }
    triggerOnActionTurnChanged();
});

globalEvents.TI4.onTurnOrderChanged.add(() => {
    if (VERBOSE) {
        console.log("export-current-turn onTurnOrderChanged");
    }
    triggerOnActionTurnChanged();
});

globalEvents.TI4.onTurnOrderEmpty.add((playerSlot) => {
    if (VERBOSE) {
        console.log("export-current-turn onTurnOrderEmpty");
    }
    _allPassedRound = getRound();
    triggerOnActionTurnChanged();
});

if (!world.__isMock) {
    process.nextTick(() => {
        if (VERBOSE) {
            console.log("export-current-turn initial state");
            triggerOnActionTurnChanged();
        }
    });
}
