/**
 * Store: https://ti4-game-data.appspot.com/data?timestamp=<v>
 * Store: https://ti4-game-data.appspot.com/data?key=<v>
 * Alec/Root's Twitch overlay: https://ti4-tts-gamedata-display-tool.herokuapp.com/
 * TheParsleySage's data studio: https://datastudio.google.com/s/prr6ZINoncQ
 *
 * Read w/ parse: curl 'https://ti4-game-data.appspot.com/data?key=<v>' | python -m json.tool
 *
 * Archived data in the google cloud, one bucket per month updated daily:
 * https://storage.googleapis.com/ti4-game-data.appspot.com/2021_02
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
    require("./updator-perf"),
    require("./updator-player-active"),
    require("./updator-player-alliances"),
    require("./updator-player-color"),
    require("./updator-player-command-tokens"),
    require("./updator-player-custodians"),
    require("./updator-player-faction-name"),
    require("./updator-player-hand-summary"),
    require("./updator-player-leaders"),
    require("./updator-player-planet-totals"),
    require("./updator-player-score"),
    require("./updator-player-strategy-cards"),
    require("./updator-player-tech"),
    require("./updator-player-tgs"),
    require("./updator-round"),
    require("./updator-timestamp"),
    require("./updator-turn"),
];
let _addedPlayerNames = false;

const DEFAULT_HOST = "ti4-game-data.appspot.com";
const LOCALHOST = "localhost:8080";

const POSTKEY = "postkey_ttpg";
const POSTTIMESTAMP = "posttimestamp_ttpg";

const TIMESTAMP_DELAY_MSECS = 15 * 60 * 1000;
const KEY_DELAY_MSECS = 45 * 1000;

const TI4_STREAMER_BUDDY_KEY = "buddy";
const TI4_STREAMER_BUDDY_KEY_DELAY_MSECS = 5 * 1000;

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

        this._endpointToLastPostString = {};
        this._history = [];

        // Update on game end (throttle).
        this._onGameEndLastSendTimestamp = 0;
        globalEvents.TI4.onGameEnded.add((player) => {
            const timestamp = Date.now() / 1000;
            if (timestamp > this._onGameEndLastSendTimestamp + 10) {
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

        // Reset cache.
        this._endpointToLastPostString = {};

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
        assert(!key || key.length < 32); // cap length
        this._key = key;

        if (!_addedPlayerNames) {
            _addedPlayerNames = true;
            UPDATORS.push(require("./updator-player-name"));
        }

        return this;
    }

    getStreamerOverlayKey() {
        return this._key;
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
        if (
            endpoint === POSTTIMESTAMP &&
            world.getAllPlayers().length <= 1 &&
            this._key !== "localhost"
        ) {
            return;
        }

        const data = this._createGameDataShell();
        for (const updator of UPDATORS) {
            updator(data);
        }

        this._maybeUpdateHistory(data);
        this._post(data, endpoint);
    }

    _asyncUpdate(endpoint) {
        assert(typeof endpoint == "string");

        // Abort normal (timestamp) reporting if only one player in game.
        if (
            endpoint === POSTTIMESTAMP &&
            world.getAllPlayers().length <= 1 &&
            this._key !== "localhost"
        ) {
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
                this._maybeUpdateHistory(data);
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
                return {};
            }),
            platform: "ttpg",
        };
        if (this._extraData) {
            data.extra = this._extraData;
        }
        return data;
    }

    _maybeUpdateHistory(data) {
        const round = data.round;
        assert(typeof round === "number");

        let prevRound = 0; // start history with round 1
        if (this._history.length > 0) {
            const prev = this._history[this._history.length - 1];
            prevRound = prev.round;
        }
        if (round > prevRound) {
            // Make a copy, strip out and/or condense some values.
            const copy = JSON.parse(JSON.stringify(data));
            delete copy.config;
            delete copy.isFranken;
            delete copy.isPoK;
            delete copy.mapString;
            delete copy.objectives;
            delete copy.platform;
            delete copy.setup;
            delete copy.scoreboard;
            delete copy.turn;
            for (const playerData of copy.players) {
                delete playerData.steamName;
                delete playerData.factionName;
                delete playerData.factionShort;
                delete playerData.team;
                delete playerData.active;
                delete playerData.strategyCardsFaceDown;
                playerData.technologies = playerData.technologies.length;
            }
            this._history.push(copy);
        }

        // Add to record.
        data.history = this._history;
    }

    _getUrl(endpoint) {
        assert(typeof endpoint == "string");
        assert(endpoint === POSTKEY || endpoint === POSTTIMESTAMP);

        // Set to localhost for certain reserved keys.
        let host = this._key === "localhost" ? LOCALHOST : DEFAULT_HOST;
        if (this._key === TI4_STREAMER_BUDDY_KEY && endpoint === POSTKEY) {
            host = LOCALHOST;
        }

        // Always send timestamp.
        const urlArgs = [`timestamp=${world.TI4.config.timestamp}`];

        // Only add key for the key endpoint, otherwise data is not archived.
        if (endpoint === POSTKEY && this._key) {
            urlArgs.push(`key=${this._key}`);
        }

        return `http://${host}/${endpoint}?${urlArgs.join("&")}`;
    }

    _post(data, endpoint) {
        assert(typeof endpoint == "string");

        // Drop if nothing changed.  No native digest, just keep whole string.
        const timestamp = data.timestamp;
        data.timestamp = 0; // remove timestamp for comparison with previous
        const thisPostStr = JSON.stringify(data);
        const lastPostStr = this._endpointToLastPostString[endpoint];
        if (lastPostStr === thisPostStr) {
            return; // nothing changed
        }
        this._endpointToLastPostString[endpoint] = thisPostStr;
        data.timestamp = timestamp; // restore

        // Post.
        const url = this._getUrl(endpoint);
        const fetchOptions = {
            headers: { "Content-type": "application/json;charset=UTF-8" },
            body: JSON.stringify(data), // timestamp got added
            method: "POST",
        };
        fetch(url, fetchOptions)
            .then((res) => {
                //console.log(`fetch response code ${res.status}`)
            })
            .catch((error) => {
                // If fetch fails clear the last-sent cache.
                //console.log(`fetch error "${error}"`);
                this._endpointToLastPostString[endpoint] = undefined;
            });
    }
}

module.exports = { GameData, DEFAULT_HOST, POSTKEY, POSTTIMESTAMP };
