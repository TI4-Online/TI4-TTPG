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

        return this._tabStatsUI;
    }

    updateUI() {
        const onDataCallback = (data) => {
            if (this._tabStatsUI) {
                this._tabStatsUI.update(data);
            }
        };
        TabStats.getPlayerDataAsync(onDataCallback);
    }
}

module.exports = { TabStats };
