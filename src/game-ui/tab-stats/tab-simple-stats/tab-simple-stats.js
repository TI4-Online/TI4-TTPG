const assert = require("../../../wrapper/assert-wrapper");
const { TabSimpleStatsUI } = require("./tab-simple-stats-ui");
const { globalEvents, world } = require("../../../wrapper/api");

const FILL_TASKS = [
    require("../../../lib/game-data/updator-player-active"),
    require("../../../lib/game-data/updator-player-command-tokens"),
    require("../../../lib/game-data/updator-player-name"),
    require("../../../lib/game-data/updator-player-faction-name"),
    require("../../../lib/game-data/updator-player-planet-totals"),
    require("../../../lib/game-data/updator-player-score"),
    require("../../../lib/game-data/updator-player-strategy-cards"),
    require("../../../lib/game-data/updator-player-tgs"),
    require("../../../lib/game-data/updator-timestamp"),
];

/**
 * Display score, strategy card pick (and if used).  Display token counts, res/inf, etc.
 */
class TabSimpleStats {
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
        this._tabSimpleStatsUI = undefined;
        this._onDataCallback = (data) => {
            if (this._tabSimpleStatsUI) {
                this._tabSimpleStatsUI.update(data);
            }
        };
        globalEvents.TI4.onPlayerColorChanged.add(() => {
            if (this._tabSimpleStatsUI) {
                const data = TabSimpleStats.getPlayerDataSync();
                this._tabSimpleStatsUI.resetUI();
                this._tabSimpleStatsUI.update(data);
            }
        });
    }

    getUI() {
        this._tabSimpleStatsUI = new TabSimpleStatsUI();

        // Do a sync update right away.  Sync does a good deal of
        // work, but still very performant.
        const data = TabSimpleStats.getPlayerDataSync();
        this._tabSimpleStatsUI.update(data);

        const widget = this._tabSimpleStatsUI.getWidget();
        if (widget._onFreed) {
            widget._onFreed.add(() => {
                this._tabSimpleStatsUI = undefined;
            });
        }
        return widget;
    }

    updateUI() {
        TabSimpleStats.getPlayerDataAsync(this._onDataCallback);
    }
}

module.exports = { TabSimpleStats };
