const assert = require("../../wrapper/assert-wrapper");
const { fetch, world } = require("../../wrapper/api");

const UPDATORS = [require("./updator-config")];

const DEFAULT_HOST = "ti4-game-data.appspot.com";
const LOCALHOST = "localhost:8080";

const DEFAULT_DELAY_MSECS = 10 * 60 * 1000;
const KEY_DELAY_MSECS = 30 * 1000;

// TIER 1:
// score
// objectives
// TIER 2:
// tech

/**
 * Periodic upload of (normally) anonymized game state.
 * When used with streamer mode will include player names.
 */
class GameData {
    constructor() {
        this._key = false;
        this._intervalHandle = false;
        this._extraData = false;
    }

    /**
     * Activate periodic updates.
     *
     * @returns {GameData} self, for chaining
     */
    enable() {
        this.disable(); // cancel if currently active

        const delay = this._key ? KEY_DELAY_MSECS : DEFAULT_DELAY_MSECS;
        this._intervalHandle = setInterval(() => {
            this._asyncUpdate();
        }, delay);

        return this;
    }

    /**
     * Cancel periodic updates, if active.
     *
     * @returns {GameData} self, for chaining
     */
    disable() {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = false;
        }
        return this;
    }

    /**
     * Enable streamer overlay mode, faster updates and includes player names.
     * Caller must call enable() to reset timer!!
     *
     * @param {string} key
     * @returns {GameData} self, for chaining
     */
    setStreamerOverlayKey(key) {
        assert(typeof key === "string");
        assert(key.length > 0);
        this._key = key;
        return this;
    }

    /**
     * Add 'extra' data component.  Overwrites existing if present.
     *
     * NOTE: not persisted across save/load, caller must re-register if needed.
     *
     * @param {string} key
     * @param {?} value - anything JSON serializable
     * @returns {GameData} self, for chaining
     */
    addExtra(key, value) {
        if (!this._extraData) {
            this._extraData = {};
        }
        this._extraData[key] = value;
        return this;
    }

    _syncUpdate() {
        const data = this._createGameDataShell();
        for (const updator of UPDATORS) {
            updator(data);
        }
        this._post(data);
    }

    _asyncUpdate() {
        const data = this._createGameDataShell();
        const updators = [...UPDATORS];
        const doNextUpdatorOrPost = () => {
            const updator = updators.shift();
            if (!updator) {
                this._post(data);
                return;
            }
            process.nextTick(doNextUpdatorOrPost);
        };
        process.nextTick(doNextUpdatorOrPost);
    }

    _createGameDataShell() {
        const data = {
            timestamp: Date.now() / 1000,
            players: world.TI4.getAllPlayerDesks().map((desk) => {
                return { color: desk.colorName };
            }),
        };
        // Streamer data includes player names.
        if (this._key) {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const playerData = data.players[playerDesk.index];
                const player = world.getPlayerBySlot(playerDesk.playerSlot);
                playerData.steamName = player ? player.getName() : "-";
            }
        }
        if (this._extraData) {
            data.extra = this._extraData;
        }
        return data;
    }

    _getUrl() {
        const host = this._key === "localhost" ? LOCALHOST : DEFAULT_HOST;
        const path = this._key ? "postkey" : "posttimestamp";
        const urlArgs = [`timestamp=${world.TI4.config.timestamp}`];
        if (this._key) {
            urlArgs.push(`key=${this._key}`);
        }
        return `http://${host}/${path}?${urlArgs.join("&")}`;
    }

    _post(data) {
        const url = this.getUrl();
        const fetchOptions = {
            body: JSON.stringify(data),
            method: "POST",
        };
        const promise = fetch(url, fetchOptions);
        promise.then((res) => console.log(JSON.stringify(res.json())));
    }
}

module.exports = { GameData };
