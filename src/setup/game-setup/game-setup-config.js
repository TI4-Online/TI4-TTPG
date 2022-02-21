const assert = require("../../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../../lib/global-saved-data");
const { globalEvents } = require("../../wrapper/api");

const KEY = GLOBAL_SAVED_DATA_KEY.GAME_SETUP_CONFIG;

/**
 * Keep persistent game setup configuration.
 */
class GameSetupConfig {
    constructor() {
        this._state = GlobalSavedData.get(KEY, {
            playerCount: 6,
            gamePoints: 10,
            pok: true,
            omega: true,
            codex1: true,
            codex2: true,
            franken: false,
            timestamp: 0,
        });
    }

    get playerCount() {
        return this._state.playerCount;
    }
    get gamePoints() {
        return this._state.gamePoints;
    }
    get pok() {
        return this._state.pok;
    }
    get omega() {
        return this._state.omega;
    }
    get codex1() {
        return this._state.codex1;
    }
    get codex2() {
        return this._state.codex2;
    }
    get franken() {
        return this._state.franken;
    }
    get timestamp() {
        return this._state.timestamp;
    }

    setPlayerCount(value, player) {
        assert(typeof value === "number");
        assert(1 <= value && value <= 8);
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

    setOmega(value) {
        assert(typeof value === "boolean");
        this._state.omega = value;
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

    setFranken(value) {
        assert(typeof value === "boolean");
        this._state.franken = value;
        GlobalSavedData.set(KEY, this._state);
    }

    setTimestamp(value) {
        assert(typeof value === "number");
        this._state.timestamp = value;
        GlobalSavedData.set(KEY, this._state);
    }
}

module.exports = { GameSetupConfig };
