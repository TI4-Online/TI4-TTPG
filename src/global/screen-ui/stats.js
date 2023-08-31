const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    HorizontalAlignment,
    PlayerPermission,
    Text,
    TextJustification,
    VerticalAlignment,
    globalEvents,
    world,
} = require("../../wrapper/api");

const FILL_TASKS = [
    require("../../lib/game-data/updator-player-command-tokens"),
    require("../../lib/game-data/updator-player-planet-cards"),
    require("../../lib/game-data/updator-player-planet-totals"),
    require("../../lib/game-data/updator-player-score"),
    require("../../lib/game-data/updator-player-tgs"),
];

const WIDTH = 500;
const FONT_SIZE = 12;
const DISTANCE_TO_EDGE = 14;
const PAD = 4;

let _instance = undefined;

class StatsScreenUI {
    static getInstance() {
        if (!_instance) {
            _instance = new StatsScreenUI();
        }
        return _instance;
    }

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

    constructor() {
        this._playerSlots = [];
        this._playerEntries = [];

        this._ui = undefined;
        this._box = undefined;

        const delayedUpdate = () => {
            if (!this._ui) {
                return; // not showing
            }
            world.TI4.asyncTaskQueue.add(() => {
                this.update();
            });
        };
        setInterval(delayedUpdate, 3000);

        globalEvents.TI4.onPlayerCountChanged.add(() => {
            this.updateForPlayerCount();
            delayedUpdate();
        });
        globalEvents.TI4.onPlayerColorChanged.add(() => {
            this.updateForPlayerCount();
            delayedUpdate();
        });

        this.updateForPlayerCount();
        this.update();
    }

    _show() {
        if (this._ui) {
            return; // already showing
        }
        this._box = WidgetFactory.layoutBox()
            .setPadding(0, DISTANCE_TO_EDGE, 0, DISTANCE_TO_EDGE)
            .setOverrideWidth(WIDTH)
            .setMinimumHeight(100);

        const outer = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setVerticalAlignment(VerticalAlignment.Bottom)
            .setChild(this._box);

        this.updateForPlayerCount();

        this._ui = WidgetFactory.screenUIElement();
        this._ui.relativeWidth = true;
        this._ui.width = 0.2; // if too small the WIDTH is reduced
        this._ui.relativeHeight = true;
        this._ui.height = 0.3;
        this._ui.relativePositionX = true;
        this._ui.positionX = 1 - this._ui.width;
        this._ui.relativePositionY = true;
        this._ui.positionY = 1 - this._ui.height;
        this._ui.widget = outer;

        const playerPermission = new PlayerPermission().setPlayerSlots(
            this._playerSlots
        );
        this._ui.players = playerPermission;

        world.addScreenUI(this._ui);
    }

    _hide() {
        if (!this._ui) {
            return; // already hidden
        }
        world.removeScreenUIElement(this._ui);
        WidgetFactory.release(this._ui);
        this._ui = undefined;
        this._box = undefined;
        this._playerEntries = [];
    }

    toggleVisibility(playerSlot) {
        assert(typeof playerSlot === "number");

        console.log(`StatsScreenUI.toggleVisibility ${playerSlot}`);

        const index = this._playerSlots.indexOf(playerSlot);
        if (index >= 0) {
            this._playerSlots.splice(index, 1);
        } else {
            this._playerSlots.push(playerSlot);
        }

        if (this._playerSlots.length === 0 && this._ui) {
            this._hide();
        } else if (this._playerSlots.length > 0 && !this._ui) {
            this._show();
        } else {
            // Visible to at least one player, just update permission.
            const playerPermission = new PlayerPermission().setPlayerSlots(
                this._playerSlots
            );
            this._ui.players = playerPermission;
        }

        // Update after permission change.
        if (this._ui) {
            world.updateScreenUI(this._ui);
        }
    }

    updateForPlayerCount() {
        if (!this._box) {
            return;
        }
        console.log("StatsScreenUI.updateForPlayerCount");

        this._playerEntries = [];
        world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
            const color = playerDesk.widgetColor;
            const name = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText(playerDesk.colorName);
            const score = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0");
            const resources = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0/0");
            const influence = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0/0");
            const planetCount = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0");
            const tradegoods = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0/0");
            const tokens = new Text()
                .setFontSize(FONT_SIZE)
                .setTextColor(color)
                .setJustification(TextJustification.Center)
                .setText("0/0/0");
            this._playerEntries.push({
                name,
                score,
                resources,
                influence,
                planetCount,
                tradegoods,
                tokens,
            });
        });

        const labelName = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(""); // empty spot
        const colName = WidgetFactory.verticalBox().addChild(labelName);
        this._playerEntries.forEach((playerEntry) => {
            colName.addChild(playerEntry.name);
        });

        const labelScore = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.score"));
        const colScore = WidgetFactory.verticalBox().addChild(labelScore);
        this._playerEntries.forEach((playerEntry) => {
            colScore.addChild(playerEntry.score);
        });

        const labelRes = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.resources"));
        const colRes = WidgetFactory.verticalBox().addChild(labelRes);
        this._playerEntries.forEach((playerEntry) => {
            colRes.addChild(playerEntry.resources);
        });

        const labelInf = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.influence"));
        const colInf = WidgetFactory.verticalBox().addChild(labelInf);
        this._playerEntries.forEach((playerEntry) => {
            colInf.addChild(playerEntry.influence);
        });

        const labelPlanetCount = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.planet_count"));
        const colPlanetCount =
            WidgetFactory.verticalBox().addChild(labelPlanetCount);
        this._playerEntries.forEach((playerEntry) => {
            colPlanetCount.addChild(playerEntry.planetCount);
        });

        const labelTradegoods = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.tradegoodsAndCommodities"));
        const colTradegoods =
            WidgetFactory.verticalBox().addChild(labelTradegoods);
        this._playerEntries.forEach((playerEntry) => {
            colTradegoods.addChild(playerEntry.tradegoods);
        });

        const labelTokens = new Text()
            .setFontSize(FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.label.tokens"));
        const colTokens = WidgetFactory.verticalBox().addChild(labelTokens);
        this._playerEntries.forEach((playerEntry) => {
            colTokens.addChild(playerEntry.tokens);
        });

        const panel = WidgetFactory.horizontalBox()
            .addChild(colName, 3)
            .addChild(colScore, 2)
            .addChild(colRes, 2)
            .addChild(colInf, 2)
            .addChild(colPlanetCount, 2)
            .addChild(colTradegoods, 2)
            .addChild(colTokens, 3);
        const padded = WidgetFactory.layoutBox()
            .setPadding(PAD, PAD, PAD, PAD)
            .setChild(panel);
        const v = 0.02;
        const v2 = 0.3;
        const border = WidgetFactory.border()
            .setColor([v, v, v, 1])
            .setChild(padded);
        const outerBorder = WidgetFactory.border()
            .setColor([v2, v2, v2, 1])
            .setChild(border);
        WidgetFactory.setChild(this._box, outerBorder);
    }

    update() {
        const callback = (data) => {
            data.players.forEach((playerData, index) => {
                const entry = this._playerEntries[index];
                if (!entry) {
                    return;
                }
                let t;

                t = `${playerData.score}`;
                entry.score.setText(t);

                t = `${playerData.planetTotals.resources.avail}/${playerData.planetTotals.resources.total}`;
                entry.resources.setText(t);

                t = `${playerData.planetTotals.influence.avail}/${playerData.planetTotals.influence.total}`;
                entry.influence.setText(t);

                t = `${playerData.planetCards.length}`;
                entry.planetCount.setText(t);

                t = `${playerData.commodities}/${playerData.tradeGoods}`;
                entry.tradegoods.setText(t);

                t = `${playerData.commandTokens.tactics}/${playerData.commandTokens.fleet}/${playerData.commandTokens.strategy}`;
                entry.tokens.setText(t);
            });
        };
        StatsScreenUI.getPlayerDataAsync(callback);
    }
}

const actionName = "*" + locale("ui.menu.toggle_stats");
world.addCustomAction(actionName);
globalEvents.onCustomAction.add((player, id) => {
    if (id === actionName) {
        StatsScreenUI.getInstance().toggleVisibility(player.getSlot());
    }
});

module.exports = { StatsScreenUI };
