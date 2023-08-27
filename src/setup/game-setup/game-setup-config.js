const assert = require("../../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../../lib/saved-data/global-saved-data");
const { globalEvents } = require("../../wrapper/api");

const KEY = GLOBAL_SAVED_DATA_KEY.GAME_SETUP_CONFIG;
const DEFAULT = {
    playerCount: 6,
    gamePoints: 10,
    pok: true,
    codex1: true,
    codex2: true,
    codex3: true,
    codex4: true,
    baseMagen: false,
    franken: false,
    reportErrors: true,
    timestamp: 0,
    timer: -1,
};

/**
 * Keep persistent game setup configuration.
 */
class GameSetupConfig {
    constructor() {
        this._state = GlobalSavedData.get(KEY, DEFAULT);
    }

    /**
     * Get state value.
     *
     * Value cannot be undefined.  If it is, it means that key was added later
     * and saved games (or initial states, if not updated) lack it.  In that
     * case provide the default.
     *
     * @param {string} key
     * @param {?} defaultValue
     * @returns {?}
     */
    _getState(key, defaultValue) {
        assert(typeof key === "string");
        assert(defaultValue !== undefined);
        const result = this._state[key];
        return result === undefined ? defaultValue : result;
    }

    get playerCount() {
        return this._getState("playerCount", DEFAULT.playerCount);
    }
    get gamePoints() {
        return this._getState("gamePoints", DEFAULT.gamePoints);
    }
    get pok() {
        return this._getState("pok", DEFAULT.pok);
    }
    get codex1() {
        return this._getState("codex1", DEFAULT.codex1);
    }
    get codex2() {
        return this._getState("codex2", DEFAULT.codex2);
    }
    get codex3() {
        return this._getState("codex3", DEFAULT.codex3);
    }
    get codex4() {
        return this._getState("codex4", DEFAULT.codex4);
    }
    get baseMagen() {
        return this._getState("baseMagen", DEFAULT.baseMagen);
    }
    get franken() {
        return this._getState("franken", DEFAULT.franken);
    }
    get reportErrors() {
        return this._getState("reportErrors", DEFAULT.reportErrors);
    }
    get timestamp() {
        return this._getState("timestamp", DEFAULT.timestamp);
    }
    get timer() {
        return this._getState("timer", DEFAULT.timer);
    }

    setPlayerCount(value, player) {
        assert(typeof value === "number");
        assert(1 <= value && value <= 8);
        globalEvents.TI4.onPlayerCountAboutToChange.trigger(value, player);
        this._state.playerCount = value;
        GlobalSavedData.set(KEY, this._state);
        globalEvents.TI4.onPlayerCountChanged.trigger(value, player);
    }

    setGamePoints(value) {
        assert(typeof value === "number");
        assert(1 <= value && value <= 14);
        this._state.gamePoints = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setPoK(value) {
        assert(typeof value === "boolean");
        this._state.pok = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setCodex1(value) {
        assert(typeof value === "boolean");
        this._state.codex1 = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setCodex2(value) {
        assert(typeof value === "boolean");
        this._state.codex2 = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setCodex3(value) {
        assert(typeof value === "boolean");
        this._state.codex3 = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setCodex4(value) {
        assert(typeof value === "boolean");
        this._state.codex4 = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setBaseMagen(value) {
        assert(typeof value === "boolean");
        this._state.baseMagen = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setFranken(value) {
        assert(typeof value === "boolean");
        this._state.franken = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setReportErrors(value) {
        assert(typeof value === "boolean");
        this._state.reportErrors = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setTimestamp(value) {
        assert(typeof value === "number");
        this._state.timestamp = value;
        GlobalSavedData.set(KEY, this._state);
    }

    /**
     * Timer encoding:
     * -1: off
     * 0: count up
     * positive #: count down from #
     *
     * @param {number} value
     */
    setTimer(value) {
        assert(typeof value === "number");
        this._state.timer = value;
        GlobalSavedData.set(KEY, this._state);
        globalEvents.TI4.onTimerConfigChanged.trigger(value);
    }
}

module.exports = { GameSetupConfig };
