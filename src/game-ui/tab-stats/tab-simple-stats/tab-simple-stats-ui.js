const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { ColorUtil } = require("../../../lib/color/color-util");
const { StatsScreenUI } = require("../../../global/screen-ui/stats");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");
const CONFIG = require("../../game-ui-config");
const {
    HorizontalAlignment,
    VerticalAlignment,
    world,
} = require("../../../wrapper/api");

// Background signals if active
// Player name
// Faction name
// Score
// Strategy Card(s) [strikethrough if played]
// Token counts
// Res/inf
// Tradegoods
class PlayerStatsUI {
    constructor(playerDesk) {
        assert(playerDesk);

        this._mainWidget = WidgetFactory.border();
        this._colorName = `[${playerDesk.colorName}]`;

        const textColor = playerDesk.plasticColor;
        const majorFontSize = CONFIG.fontSize;
        const minorFontSize = majorFontSize / 2;

        this._steamName = WidgetFactory.text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._factionName = WidgetFactory.text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._score = WidgetFactory.text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._strategyCardPanel = WidgetFactory.horizontalBox();
        this._strategyCardTexts = [
            WidgetFactory.text()
                .setFontSize(majorFontSize)
                .setTextColor(textColor), // reserve two
            WidgetFactory.text()
                .setFontSize(majorFontSize)
                .setTextColor(textColor),
        ];
        this._commandTokens = WidgetFactory.text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._resources = WidgetFactory.text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._influence = WidgetFactory.text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._commodities = WidgetFactory.text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._tradegoods = WidgetFactory.text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);

        this._strategyCardTexts.forEach((text) => {
            this._strategyCardPanel.addChild(text);
        });

        const resInfPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._resources)
            .addChild(this._influence);

        const commoditiesTgsPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._commodities)
            .addChild(this._tradegoods);

        const factionScorePanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._score)
            .addChild(this._factionName);

        const overallPanel = WidgetFactory.verticalBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .addChild(this._steamName)
            .addChild(factionScorePanel)
            .addChild(this._strategyCardPanel)
            .addChild(this._commandTokens)
            .addChild(resInfPanel)
            .addChild(commoditiesTgsPanel);

        const overallBox = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(overallPanel);

        this._mainWidget.setChild(overallBox);
    }

    getWidget() {
        return this._mainWidget;
    }

    update(playerData) {
        assert(typeof playerData.steamName === "string");
        let name = playerData.steamName;
        if (name === "-") {
            name = this._colorName;
        }
        this._steamName.setText(name);

        assert(typeof playerData.factionShort === "string");
        let factionName = playerData.factionShort;
        if (factionName === "-") {
            factionName = "[faction]";
        }
        this._factionName.setText(factionName);

        assert(typeof playerData.score === "number");
        this._score.setText(`${playerData.score}`);

        // Only apply child spacing if using multiple strategy cards.
        this._strategyCardPanel.setChildDistance(
            playerData.strategyCards.length > 1 ? CONFIG.spacing : 0
        );
        this._strategyCardTexts.forEach((text, index) => {
            text.setText(index === 0 ? "-" : "");
        });
        playerData.strategyCards.forEach((strategyCardName, index) => {
            const strategyCardText = this._strategyCardTexts[index];
            if (!strategyCardText) {
                return;
            }
            const isPlayed =
                playerData.strategyCardsFaceDown.includes(strategyCardName);
            strategyCardText.setBold(!isPlayed).setText(strategyCardName);
        });

        this._commandTokens.setText(
            `TOKENS: ${playerData.commandTokens.tactics}/${playerData.commandTokens.fleet}/${playerData.commandTokens.strategy}`
        );

        this._resources.setText(
            `RES: ${playerData.planetTotals.resources.avail}/${playerData.planetTotals.resources.total}`
        );
        this._influence.setText(
            `INF: ${playerData.planetTotals.influence.avail}/${playerData.planetTotals.influence.total}`
        );

        this._commodities.setText(`C: ${playerData.commodities}`);
        this._tradegoods.setText(`TG: ${playerData.tradeGoods}`);

        assert(typeof playerData.active === "boolean");
        const isActive = playerData.active;
        const colorPassed = ColorUtil.colorFromHex("#101010");
        const colorActive = ColorUtil.colorFromHex("#080808");
        this._mainWidget.setColor(isActive ? colorActive : colorPassed);
    }
}

class TabSimpleStatsUI {
    constructor() {
        this._mainWidget = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        // Per-player stats in desk index order.
        this._playerStatsUIs = [];

        // Match table positions, assuming clockwise from "bottom right"
        // across two sides.
        const playerCount = world.TI4.config.playerCount;
        const numRows = 2;
        const numCols = Math.ceil(playerCount / numRows);
        const rows = new Array(numRows).fill(0).map(() => {
            return [];
        });
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            let index = playerDesk.index;
            let row = 1;
            let col = numCols - index - 1;
            if (index >= numCols) {
                row = 0;
                col = index % numCols;
            }
            const playerStatsUI = new PlayerStatsUI(playerDesk);
            rows[row][col] = playerStatsUI;
            this._playerStatsUIs.push(playerStatsUI);
        }

        for (const row of rows) {
            const panel = WidgetFactory.horizontalBox().setChildDistance(
                CONFIG.spacing
            );
            this._mainWidget.addChild(panel, 1);
            for (const playerStatsUI of row) {
                panel.addChild(playerStatsUI.getWidget(), 1);
            }
        }

        const showOnScreenStatsButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.toggle_on_screen_stats"));
        showOnScreenStatsButton.onClicked.add((button, player) => {
            const statsScreenUI = StatsScreenUI.getInstance();
            const playerSlot = player.getSlot();
            statsScreenUI.toggleVisibility(playerSlot);
        });
        this._mainWidget.addChild(showOnScreenStatsButton);
    }

    getWidget() {
        return this._mainWidget;
    }

    update(data) {
        assert(data);
        assert(Array.isArray(data.players));
        assert.equal(data.players.length, this._playerStatsUIs.length);

        data.players.forEach((playerData, index) => {
            const playerStatsUI = this._playerStatsUIs[index];
            playerStatsUI.update(playerData);
        });
    }
}

module.exports = { TabSimpleStatsUI };
