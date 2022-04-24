/**
 * Store: https://ti4-game-data.appspot.com/data?timestamp=<v>
 * Store: https://ti4-game-data.appspot.com/data?key=<v>
 * Alec/Root's Twitch overlay: https://ti4-tts-gamedata-display-tool.herokuapp.com/
 * TheParsleySage's data studio: https://datastudio.google.com/s/prr6ZINoncQ
 *
 * Read w/ parse: curl 'https://ti4-game-data.appspot.com/data?key=<v>' | python -m json.tool
 */

const assert = require("../../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../../lib/saved-data/global-saved-data");
const { fetch, globalEvents, world } = require("../../wrapper/api");

const UPDATORS = [
    require("./updator-config"),
    require("./updator-hex-summary"),
    require("./updator-laws"),
    require("./updator-map-string"),
    require("./updator-objectives"),
    require("./updator-player-active"),
    require("./updator-player-alliances"),
    require("./updator-player-command-tokens"),
    require("./updator-player-faction-name"),
    require("./updator-player-hand-summary"),
    require("./updator-player-leaders"),
    require("./updator-player-planet-totals"),
    require("./updator-player-score"),
    require("./updator-player-strategy-cards"),
    require("./updator-player-tech"),
    require("./updator-player-tgs"),
    require("./updator-round"),
    require("./updator-turn"),
];

const DEFAULT_HOST = "ti4-game-data.appspot.com";
const LOCALHOST = "localhost:8080";

const POSTKEY = "postkey_ttpg";
const POSTTIMESTAMP = "posttimestamp_ttpg";

const TIMESTAMP_DELAY_MSECS = 15 * 60 * 1000;
const KEY_DELAY_MSECS = 45 * 1000;

const TI4_STREAMER_BUDDY_KEY = "buddy";
const TI4_STREAMER_BUDDY_KEY_DELAY_MSECS = 5 * 1000;

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
        this._intervalHandleTimestamp = false;
        this._intervalHandleKey = false;
        this._extraData = false;

        this._lastPostString = false;

        // Update on game end (throttle).
        this._onGameEndLastSendTimestamp = 0;
        globalEvents.TI4.onGameEnded.add((player) => {
            const timestamp = Date.now() / 1000;
            if (timestamp > this._onGameEndLastSendTimestamp + 60) {
                this._onGameEndLastSendTimestamp = timestamp;
                this._asyncUpdate(POSTTIMESTAMP);
            }
        });
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

        // Update immediately to pop-up authorization dialog(s).
        this._asyncUpdate(POSTTIMESTAMP);
        if (this._key) {
            this._asyncUpdate(POSTKEY);
        }

        // Run separate timestamp and key handlers.  Backend stores timestamp
        // data but only in-memory caches streamer key data.
        this._intervalHandleTimestamp = setInterval(() => {
            this._asyncUpdate(POSTTIMESTAMP);
        }, TIMESTAMP_DELAY_MSECS);

        if (this._key) {
            let keyDelayMsecs = KEY_DELAY_MSECS;
            if (this._key === TI4_STREAMER_BUDDY_KEY) {
                keyDelayMsecs = TI4_STREAMER_BUDDY_KEY_DELAY_MSECS;
            }
            this._intervalHandleKey = setInterval(() => {
                this._asyncUpdate(POSTKEY);
            }, keyDelayMsecs);
        }

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

        if (this._intervalHandleTimestamp) {
            clearInterval(this._intervalHandleTimestamp);
            this._intervalHandleTimestamp = false;
        }
        if (this._intervalHandleKey) {
            clearInterval(this._intervalHandleKey);
            this._intervalHandleKey = false;
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
        assert(!key || (typeof key === "string" && key.length > 0));
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

    _syncUpdate(endpoint) {
        assert(typeof endpoint == "string");

        // Abort normal (timestamp) reporting if only one player in game.
        if (endpoint === POSTTIMESTAMP && world.getAllPlayers().length <= 1) {
            return;
        }

        const data = this._createGameDataShell();
        for (const updator of UPDATORS) {
            updator(data);
        }

        this._post(data, endpoint);
    }

    _asyncUpdate(endpoint) {
        assert(typeof endpoint == "string");

        // Abort normal (timestamp) reporting if only one player in game.
        if (endpoint === POSTTIMESTAMP && world.getAllPlayers().length <= 1) {
            return;
        }

        //console.log(`GameData._asyncUpdate ${Date.now() / 1000}`);
        const data = this._createGameDataShell();
        const updators = [...UPDATORS]; // copy can use shift to mutate
        const doNextUpdatorOrPost = () => {
            if (!this._enabled) {
                return;
            }
            const updator = updators.shift();
            if (!updator) {
                this._post(data, endpoint);
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
            platform: "ttpg",
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

    _getUrl(endpoint) {
        assert(typeof endpoint == "string");
        assert(endpoint === POSTKEY || endpoint === POSTTIMESTAMP);

        let host = this._key === "localhost" ? LOCALHOST : DEFAULT_HOST;
        if (this._key === TI4_STREAMER_BUDDY_KEY && endpoint === POSTKEY) {
            host = LOCALHOST;
        }
        const urlArgs = [`timestamp=${world.TI4.config.timestamp}`];
        if (this._key) {
            urlArgs.push(`key=${this._key}`);
        }
        return `http://${host}/${endpoint}?${urlArgs.join("&")}`;
    }

    _post(data, endpoint) {
        assert(typeof endpoint == "string");

        //console.log(`XXX GAME DATA XXX\n${JSON.stringify(data)}`);

        // Drop if nothing changed.  No native digest, just keep whole string.
        const thisPostStr = JSON.stringify(data);
        if (this._lastPostString === thisPostStr) {
            return; // nothing changed
        }
        this._lastPostString = thisPostStr;

        // Add current timestamp.
        data.timestamp = Date.now() / 1000;

        // Post.
        const url = this._getUrl(endpoint);
        const fetchOptions = {
            body: JSON.stringify(data),
            method: "POST",
        };
        const promise = fetch(url, fetchOptions);
        promise.then((res) => console.log(JSON.stringify(res.json())));
    }
}

module.exports = { GameData, DEFAULT_HOST, POSTKEY, POSTTIMESTAMP };
