const { world } = require("../wrapper/api");
const assert = require("../wrapper/assert-wrapper");

const MAX_JSON_LENGTH = 1023;

/**
 * Register names here to avoid collisions.
 */
const GLOBAL_SAVED_DATA_KEY = Object.freeze({
    PLAYER_COUNT: "playerCount",
    DESK_STATE: "desks",
    GAME_SETUP_CONFIG: "config",
});

/**
 * Store a key/value in the world saved data.
 * Encoded JSON is limited to 1023 bytes!
 */
class GlobalSavedData {
    /**
     * Read persistent data.
     *
     * @param {string} key
     * @param {*} defaultValue - anything JSON can stringify
     * @returns {*} defaultValue, if given
     */
    static get(key, defaultValue = undefined) {
        assert(typeof key === "string");

        const json = world.getSavedData();
        if (json.length > 0) {
            const parsed = JSON.parse(json);
            if (key in parsed) {
                return parsed[key];
            }
        }
        return defaultValue;
    }

    /**
     * Write persistent data.
     *
     * @param {string} key
     * @param {*} value
     */
    static set(key, value) {
        assert(typeof key === "string");

        let json = world.getSavedData();
        let parsed;
        if (json.length > 0) {
            parsed = JSON.parse(json);
        } else {
            parsed = {};
        }
        parsed[key] = value;
        json = JSON.stringify(parsed);
        assert(json.length <= MAX_JSON_LENGTH);
        world.setSavedData(json);
        if (!world.__isMock) {
            console.log(`GlobalSavedData.set(${key}): |SUM(v)|=${json.length}`);
        }
    }

    /**
     * Reset all persistent state to defaults.
     */
    static clear() {
        world.setSavedData("");
    }
}

module.exports = {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
};
