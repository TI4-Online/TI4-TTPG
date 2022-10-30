const assert = require("../../../wrapper/assert-wrapper");
const { Scoreboard } = require("../../scoreboard/scoreboard");
const {
    Border,
    Canvas,
    Color,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    refPackageId,
    world,
} = require("../../../wrapper/api");

Scoreboard;
class TurnEntryFancy extends Canvas {
    static updateArray(entries, config) {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const passedPlayerSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
        const scoreboard = Scoreboard.getScoreboard();
        const playerSlotToScore = Scoreboard.getPlayerSlotToScore(scoreboard);

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const playerDesk = playerDeskOrder[i];
            const playerSlot = playerDesk?.playerSlot;
            config.isTurn = playerDesk === currentDesk;
            config.isPassed = passedPlayerSlotSet.has(playerSlot);
            config.score = playerSlotToScore[playerSlot] || 0;
            entry.update(playerDesk, config);
        }
    }

    constructor() {
        super();

        this._canvasBackground = new Border();
        this._factionIcon = new ImageWidget();
        this._factionName = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(6)
            .setBold(true)
            .setText("FACTION");
        this._playerName = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(12)
            .setBold(true)
            .setText("Player Name");
        this._strategyCards = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(12)
            .setBold(true)
            .setText("Strategy Card");
        this._score = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(26)
            .setBold(true)
            .setText("0");

        const nameBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._playerName);
        const strategyBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._strategyCards);

        const w = 220;
        const h = 58;
        this.addChild(this._canvasBackground, 0, 0, w, h)
            .addChild(this._factionIcon, 4, 4, 40, 40)
            .addChild(this._factionName, 0, 44, 48, 15)
            .addChild(this._score, w - 45, 3, 45, 45)
            .addChild(nameBox, 0, 1, w, h / 2)
            .addChild(strategyBox, 0, h / 2 - 4, w, h / 2);
    }

    update(playerDesk, config) {
        assert(playerDesk);
        assert(typeof config === "object");
        assert(typeof config.fontSize === "number");
        assert(typeof config.fitNameLength === "number");
        assert(typeof config.isTurn === "boolean");
        assert(typeof config.isPassed === "boolean");
        assert(typeof config.score === "number");

        const playerSlot = playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);

        let name = player && player.getName();
        if (!name || name.length === 0) {
            name = `<${playerDesk.colorName}>`;
        }
        let fontSizeScale = 15 / name.length;
        fontSizeScale = Math.min(fontSizeScale, 1);
        fontSizeScale = Math.max(fontSizeScale, 0.5);
        const nameFontSize = 12 * fontSizeScale;

        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        let factionName = faction ? faction.nameAbbr : "???";
        if (factionName.startsWith("Keleres")) {
            factionName = "Keleres";
        }
        factionName = factionName.replace("-", "").toUpperCase();
        const factionIcon = faction
            ? faction.icon
            : "global/factions/bobert_icon.png";

        this._factionIcon.setImage(factionIcon, refPackageId);
        this._factionName.setText(factionName);

        this._playerName.setFontSize(nameFontSize).setText(name);
        this._strategyCards.setText("TODO");
        this._score.setText(config.score.toString());

        // Color.
        const v1 = 0.05;
        const v2 = 0.03;
        const plrColor = playerDesk.plasticColor;
        const altColor = new Color(v2, v2, v2);
        const altBgColor = new Color(v1, v1, v1);

        const fgColor = config.isTurn ? altColor : plrColor;
        let bgColor = config.isTurn ? plrColor : altBgColor;

        this._factionName.setTextColor(fgColor);
        this._playerName.setTextColor(fgColor);
        this._strategyCards.setTextColor(fgColor);
        this._score.setTextColor(fgColor);
        this._canvasBackground.setColor(bgColor);
    }
}

module.exports = { TurnEntryFancy };
