const assert = require("../../wrapper/assert-wrapper");
const { GameObject } = require("../../wrapper/api");

const MAX_JSON_LENGTH = 1023;

/**
 * Store a key/value in the object's saved data.
 * Encoded JSON is limited to 1023 bytes!
 */
class ObjectSavedData {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Read persistent data.
     *
     * @param {GameObject} obj
     * @param {string} key
     * @param {*} defaultValue - anything JSON can stringify
     * @returns {*} defaultValue, if given
     */
    static get(obj, key, defaultValue = undefined) {
        assert(obj instanceof GameObject);
        assert(typeof key === "string");

        const json = obj.getSavedData() || "";
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
     * @param {GameObject} obj
     * @param {string} key
     * @param {*} value
     */
    static set(obj, key, value) {
        assert(obj instanceof GameObject);
        assert(typeof key === "string");

        let json = obj.getSavedData();
        let parsed;
        if (json.length > 0) {
            parsed = JSON.parse(json);
        } else {
            parsed = {};
        }
        parsed[key] = value;
        json = JSON.stringify(parsed);
        assert(json.length <= MAX_JSON_LENGTH);
        obj.setSavedData(json);
    }

    /**
     * Reset all persistent state to defaults.
     */
    static clear(obj) {
        assert(obj instanceof GameObject);
        obj.setSavedData("");
    }
}

module.exports = {
    ObjectSavedData,
};
