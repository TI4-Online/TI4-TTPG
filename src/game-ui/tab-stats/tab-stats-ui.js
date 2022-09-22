const CONFIG = require("../game-ui-config");
const {
    Border,
    HorizontalAlignment,
    HorizontalBox,
    Text,
    VerticalBox,
    world,
} = require("../../wrapper/api");
const assert = require("../../wrapper/assert-wrapper");

// Background signals if active
// Player name
// Faction name
// Score
// Strategy Card(s) [strikethrough if played]
// Token counts
// Res/inf
// Tradegoods
class PlayerStatsUI extends Border {
    constructor(playerDesk) {
        assert(playerDesk);

        super();

        const textColor = playerDesk.plasticColor;
        const majorFontSize = CONFIG.fontSize;
        const minorFontSize = majorFontSize / 2;

        this._steamName = new Text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._factionName = new Text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._score = new Text()
            .setFontSize(majorFontSize)
            .setTextColor(textColor);
        this._strategyCards = [
            new Text().setFontSize(majorFontSize).setTextColor(textColor), // reserve two
            new Text().setFontSize(majorFontSize).setTextColor(textColor),
        ];
        this._commandTokens = new Text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._resources = new Text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._influence = new Text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._commodities = new Text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);
        this._tradegoods = new Text()
            .setFontSize(minorFontSize)
            .setTextColor(textColor);

        const strategyCardPanel = new HorizontalBox().setChildDistance(
            CONFIG.spacing
        );
        this._strategyCards.forEach((text) => {
            strategyCardPanel.addChild(text);
        });

        const overallPanel = new VerticalBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .addChild(this._steamName)
            .addChild(this._factionName)
            .addChild(strategyCardPanel)
            .addChild(this._commandTokens);

        const resInfPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._resources)
            .addChild(this._influence);
        overallPanel.addChild(resInfPanel);

        const commoditiesTgsPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._commodities)
            .addChild(this._tradegoods);
        overallPanel.addChild(commoditiesTgsPanel);

        this.setChild(overallPanel);
    }

    update(playerData) {
        assert(typeof playerData.steamName === "string");
        this._steamName.setText(playerData.steamName);

        assert(typeof playerData.factionName === "string");
        this._factionName.setText(playerData.factionShort);

        assert(typeof playerData.score === "number");
        this._score.setText(`${playerData.score}`);

        this._strategyCards.forEach((text, index) => {
            text.setText(index === 0 ? "-" : "");
        });
        playerData.strategyCards.forEach((strategyCardName, index) => {
            if (index > this._strategyCards.length) {
                return;
            }
            const strategyCardText = this._strategyCards[index];
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
    }
}

class TabStatsUI extends VerticalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

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
            const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
            this.addChild(panel, 1);
            for (const playerStatsUI of row) {
                panel.addChild(playerStatsUI, 1);
            }
        }
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

module.exports = { TabStatsUI };
