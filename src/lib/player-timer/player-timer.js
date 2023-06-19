const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { FindTurnOrder } = require("../phase/find-turn-order");
const gameDataRound = require("../game-data/updator-round");
const { world } = require("../../wrapper/api");

const SAVED_DATA_KEY = "playerTimer";
const SAMPLE_EVERY_N_SECONDS = 1;

const PHASE = {
    ACTION: "action",
    AGENDA: "agenda",
    STRATEGY: "strategy",
};

class PlayerTimer {
    constructor() {
        this._colorToPhaseToRoundToSeconds = {};
        this._errorMessage = undefined;

        const delayedInit = () => {
            this._load();
            setInterval(() => {
                this._doSample();
                this._save();
            }, SAMPLE_EVERY_N_SECONDS * 1000);
        };

        if (!world.__isMock) {
            // world.TI4 might not be ready, delay setup
            process.nextTick(delayedInit);
        }
    }

    _load() {
        // Store data in the timer object instead of world to reserve world for
        // drawing lines, etc.
        const timer = world.TI4.getTimer();
        if (!timer) {
            console.log("PlayerTimer._load: no timer, aborting");
            return;
        }
        const json = timer.getSavedData(SAVED_DATA_KEY);
        if (json && json.length > 0) {
            this._colorToPhaseToRoundToSeconds = JSON.parse(json) || {};
        }
    }

    _save() {
        const timer = world.TI4.getTimer();
        if (!timer) {
            console.log("PlayerTimer._save: no timer, aborting");
            return;
        }
        const json = JSON.stringify(this._colorToPhaseToRoundToSeconds);
        timer.setSavedData(json, SAVED_DATA_KEY);
    }

    /**
     * Export for streater buddy.
     *
     * @param {number} deskIndex
     * @returns {Object}
     */
    exportForGameData(deskIndex) {
        return this._colorToPhaseToRoundToSeconds;
    }

    getError() {
        return this._errorMessage;
    }

    getPlayerTimeSeconds(colorName, phaseName, round) {
        assert(typeof colorName === "string");
        assert(typeof phaseName === "string");
        assert(typeof round === "number");

        let phaseToRoundToSeconds =
            this._colorToPhaseToRoundToSeconds[colorName];
        if (!phaseToRoundToSeconds) {
            phaseToRoundToSeconds = {};
            this._colorToPhaseToRoundToSeconds[colorName] =
                phaseToRoundToSeconds;
        }

        let roundToSeconds = phaseToRoundToSeconds[phaseName];
        if (!roundToSeconds) {
            roundToSeconds = {};
            phaseToRoundToSeconds[phaseName] = roundToSeconds;
        }

        let seconds = roundToSeconds[round];
        if (!seconds) {
            seconds = 0;
            roundToSeconds = seconds;
        }

        return seconds;
    }

    _addSample(colorName, phaseName, round) {
        assert(typeof colorName === "string");
        assert(typeof phaseName === "string");
        assert(typeof round === "number");

        const oldSeconds = this.getPlayerTimeSeconds(
            colorName,
            phaseName,
            round
        );
        const newSeconds = oldSeconds + SAMPLE_EVERY_N_SECONDS;

        // "get" created missing entries.
        this._colorToPhaseToRoundToSeconds[colorName][phaseName][round] =
            newSeconds;
    }

    _doSample() {
        this._errorMessage = undefined;

        // Require game has started.
        if (world.TI4.config.timestamp <= 0) {
            this._errorMessage = locale("timer.error.game_not_started");
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

        // Require timer running.
        const timer = world.TI4.getTimer();
        if (timer && timer.__timer && timer.__timer.getDirection() === 0) {
            this._errorMessage = locale("timer.error.timer_paused");
            return; // timer paused
        }

        // Require turn active.
        const turn = world.TI4.turns.getCurrentTurn();
        if (!turn) {
            this._errorMessage = locale("timer.error.no_active_turn");
            return; // turn not set
        }

        const colorName = turn.colorName;
        const gameData = {};
        gameDataRound(gameData);
        const round = gameData.round;
        let phaseName = undefined;

        const numPickedStrategyCards = FindTurnOrder.numPickedStrategyCards();
        const isActionPhase =
            numPickedStrategyCards === world.TI4.config.playerCount;
        const isAgendaPhase = world.TI4.agenda.isActive();

        if (isAgendaPhase) {
            phaseName = PHASE.AGENDA;
        } else if (isActionPhase) {
            phaseName = PHASE.ACTION;
        } else {
            phaseName = PHASE.STRATEGY;
        }

        //console.log(`PlayerTimer [${colorName}, ${phaseName}, ${round}]`);
        this._addSample(colorName, phaseName, round);
    }
}

module.exports = { PlayerTimer, SAMPLE_EVERY_N_SECONDS, PHASE };
