const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { TabStatsUI } = require("./tab-stats-ui");

const FILL_TASKS = [
    require("../../lib/game-data/updator-player-active"),
    require("../../lib/game-data/updator-player-command-tokens"),
    require("../../lib/game-data/updator-player-name"),
    require("../../lib/game-data/updator-player-faction-name"),
    require("../../lib/game-data/updator-player-planet-totals"),
    require("../../lib/game-data/updator-player-score"),
    require("../../lib/game-data/updator-player-strategy-cards"),
    require("../../lib/game-data/updator-player-tgs"),
    require("../../lib/game-data/updator-timestamp"),
];

const PERIODIC_INTERVAL_MSECS = 5000;

// Use a single update handler, only updating the most recently created
// (prevent leaking multiple update handlers).
let _periodicStatsIntervalHandler = undefined;

/**
 * Display score, strategy card pick (and if used).  Display token counts, res/inf, etc.
 */
class TabStats {
    static getPlayerDataAsync(callback) {
        assert(typeof callback === "function");

        const data = {
            players: world.TI4.getAllPlayerDesks().map(() => {
                return {};
            }),
        };
        const tasks = [...FILL_TASKS]; // mutable copy

        const doNextTask = () => {
            const task = tasks.shift();
            if (!task) {
                callback(data);
                return;
            }
            task(data);
            world.TI4.asyncTaskQueue.add(doNextTask);
        };
        world.TI4.asyncTaskQueue.add(doNextTask);
    }

    static getPlayerDataSync() {
        const data = {
            players: world.TI4.getAllPlayerDesks().map(() => {
                return {};
            }),
        };
        for (const task of FILL_TASKS) {
            task(data);
        }
        return data;
    }

    constructor() {
        this._tabStatsUI = undefined;
    }

    getUI() {
        this._tabStatsUI = new TabStatsUI();

        // Do a sync update right away.  Sync does a good deal of
        // work, but still very performant.
        const data = TabStats.getPlayerDataSync();
        this._tabStatsUI.update(data);

        // Interval function to do async updates.
        const asyncUpdate = () => {
            const onDataCallback = (data) => {
                if (this._tabStatsUI) {
                    this._tabStatsUI.update(data);
                }
            };
            TabStats.getPlayerDataAsync(onDataCallback);
        };

        // Register new interval handler.
        console.log("TabStats.getUI: setting interval handler");
        if (_periodicStatsIntervalHandler) {
            clearInterval(_periodicStatsIntervalHandler);
            _periodicStatsIntervalHandler = undefined;
        }
        _periodicStatsIntervalHandler = setInterval(
            asyncUpdate,
            PERIODIC_INTERVAL_MSECS
        );

        return this._tabStatsUI;
    }

    releaseUI() {
        console.log("TabStats.releaseUI: clearing interval handler");
        if (_periodicStatsIntervalHandler) {
            clearInterval(_periodicStatsIntervalHandler);
            _periodicStatsIntervalHandler = undefined;
        }
    }
}

module.exports = { TabStats };
