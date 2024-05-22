const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const gameDataRound = require("../game-data/updator-round");
const { globalEvents, world } = require("../../wrapper/api");

const SAMPLE_EVERY_N_SECONDS = 1;
const SAVED_DATA_KEY = "__player-timer__";

let _actionPhaseActivePlayerSlot = -1;
let _whyPaused = "";

globalEvents.TI4.onActionTurnChanged.add((playerSlot, note) => {
    _actionPhaseActivePlayerSlot = playerSlot;
    _whyPaused = note;
});

/**
 * Track action phase time.
 */
class PlayerTimer {
    constructor() {
        this._colorToRoundToSeconds = {};

        const delayedInit = () => {
            if (this._load()) {
                setInterval(() => {
                    this._doSample();
                    this._save();
                }, SAMPLE_EVERY_N_SECONDS * 1000);
            }
        };

        if (!world.__isMock) {
            // world.TI4 might not be ready, delay setup
            process.nextTick(delayedInit);
        }
    }

    getWhyPaused() {
        return _whyPaused;
    }

    _load() {
        const json = world.getSavedData(SAVED_DATA_KEY);
        if (json && json.length > 0) {
            this._colorToRoundToSeconds = JSON.parse(json);
        }
        return true;
    }

    _save() {
        const json = JSON.stringify(this._colorToRoundToSeconds);
        world.setSavedData(json, SAVED_DATA_KEY);
    }

    /**
     * Export for streater buddy.
     *
     * @param {number} deskIndex
     * @returns {Object}
     */
    exportForGameData(deskIndex) {
        return this._colorToRoundToSeconds;
    }

    getRound() {
        return this._round;
    }

    getPlayerTimeSeconds(colorName, round) {
        assert(typeof colorName === "string");
        assert(typeof round === "number");

        let roundToSeconds = this._colorToRoundToSeconds[colorName];
        if (!roundToSeconds) {
            roundToSeconds = {};
            this._colorToRoundToSeconds[colorName] = roundToSeconds;
        }

        let seconds = roundToSeconds[round];
        if (!seconds) {
            seconds = 0;
            roundToSeconds[round] = seconds;
        }

        return seconds;
    }

    _addSample(colorName, round) {
        assert(typeof colorName === "string");
        assert(typeof round === "number");

        const oldSeconds = this.getPlayerTimeSeconds(colorName, round);
        const newSeconds = oldSeconds + SAMPLE_EVERY_N_SECONDS;

        this._round = round;

        // "get" created missing entries.
        this._colorToRoundToSeconds[colorName][round] = newSeconds;

        // Tell any listeners.
        globalEvents.TI4.onTimerUpdate.trigger(colorName, round, newSeconds);
    }

    _doSample() {
        // Abort if no active action-phase player.
        if (_actionPhaseActivePlayerSlot < 0) {
            return;
        }

        // Require game has started.
        if (world.TI4.config.timestamp <= 0) {
            return; // game not started
        }

        // Require all player have factions (e.g. do not count drafting).
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            if (!faction) {
                this._errorMessage = locale(
                    "timer.error.faction_selection_in_progress"
                );
                return; // player missing faction
            }
        }

        // Require a round is active (objectives dealt).
        const gameData = {};
        gameDataRound(gameData);
        const round = gameData.round;
        if (round < 1) {
            return; // no active round
        }

        // Require timer running.
        const timer = world.TI4.getTimer();
        if (timer && timer.__timer && timer.__timer.getDirection() === 0) {
            this._errorMessage = locale("timer.error.timer_paused");
            return; // timer paused
        }

        // Get active player color.
        const desk = world.TI4.getPlayerDeskByPlayerSlot(
            _actionPhaseActivePlayerSlot
        );
        assert(desk);
        const colorName = desk.colorName;

        //console.log(`PlayerTimer [${colorName}, ${round}]`);
        this._addSample(colorName, round);
    }
}

module.exports = { PlayerTimer, SAMPLE_EVERY_N_SECONDS };
