const assert = require("../../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../../lib/saved-data/global-saved-data");
const { fetch, world } = require("../../wrapper/api");

const UPDATORS = [
    require("./updator-config"),
    require("./updator-objectives"),
    require("./updator-player-active"),
    require("./updator-player-faction-name"),
    require("./updator-player-score"),
    require("./updator-player-strategy-cards"),
    require("./updator-player-tech"),
    require("./updator-turn"),
];

//const DEFAULT_HOST = "ti4-game-data.appspot.com";
const DEFAULT_HOST = "localhost:8080";
const LOCALHOST = "localhost:8080";

const POSTKEY = "postkey2";
const POSTTIMESTAMP = "posttimestamp2";

const DEFAULT_DELAY_MSECS = 15 * 60 * 1000;
const KEY_DELAY_MSECS = 45 * 1000;

const REQUIRED_COLORS = [
    "White",
    "Blue",
    "Purple",
    "Yellow",
    "Red",
    "Green",
    "Pink",
    "Orange",
];

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
    static maybeRestartGameData() {
        const config = GlobalSavedData.get(
            GLOBAL_SAVED_DATA_KEY.GAME_DATA_CONFIG
        );
        if (config && config.enabled) {
            world.TI4.gameData.enable();
        }
    }

    constructor() {
        this._enabled = false;
        this._key = false;
        this._intervalHandle = false;
        this._extraData = false;

        this._lastPostString = false;
    }

    updatePersistentConfig() {
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.GAME_DATA_CONFIG, {
            enabled: this._enabled,
        });
    }

    /**
     * Activate periodic updates.
     *
     * @returns {GameData} self, for chaining
     */
    enable() {
        this.disable(); // cancel if currently active
        this._enabled = true;
        this.updatePersistentConfig();

        // Update immediately.
        this._asyncUpdate();

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
        this._enabled = false;
        this.updatePersistentConfig();

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
        //console.log(`GameData._asyncUpdate ${Date.now() / 1000}`);
        const data = this._createGameDataShell();
        const updators = [...UPDATORS]; // copy can use shift to mutate
        const doNextUpdatorOrPost = () => {
            if (!this._enabled) {
                return;
            }
            const updator = updators.shift();
            if (!updator) {
                this._post(data);
                return;
            }
            // Run each updator in an ignore-errors wrapper.  If one breaks
            // at least the rest still gather/update.
            try {
                updator(data);
            } catch (exception) {
                console.error(exception);
                //throw exception;
            }
            process.nextTick(doNextUpdatorOrPost);
        };
        process.nextTick(doNextUpdatorOrPost);
    }

    _createGameDataShell() {
        const data = {
            players: world.TI4.getAllPlayerDesks().map((desk) => {
                return { color: desk.colorName };
            }),
        };

        // Root's overlay requires colors in order.  Give "required" color
        // as well as actual color.
        data.players.forEach((playerData, index) => {
            playerData.actualColor = playerData.color;
            playerData.color = REQUIRED_COLORS[index];
        });

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
        const path = this._key ? POSTKEY : POSTTIMESTAMP;
        const urlArgs = [`timestamp=${world.TI4.config.timestamp}`];
        if (this._key) {
            urlArgs.push(`key=${this._key}`);
        }
        return `http://${host}/${path}?${urlArgs.join("&")}`;
    }

    _post(data) {
        console.log(`XXX GAME DATA XXX\n${JSON.stringify(data)}`);

        // Drop if nothing changed.  No native digest, just keep whole string.
        const thisPostStr = JSON.stringify(data);
        if (this._lastPostString === thisPostStr) {
            return; // nothing changed
        }
        this._lastPostString = thisPostStr;

        // Add current timestamp.
        data.timestamp = Date.now() / 1000;

        // Post.
        const url = this._getUrl();
        const fetchOptions = {
            body: JSON.stringify(data),
            method: "POST",
        };
        const promise = fetch(url, fetchOptions);
        promise.then((res) => console.log(JSON.stringify(res.json())));
    }
}

module.exports = { GameData, DEFAULT_HOST, POSTKEY, POSTTIMESTAMP };
