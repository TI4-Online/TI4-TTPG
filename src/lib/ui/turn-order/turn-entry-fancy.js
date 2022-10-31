const assert = require("../../../wrapper/assert-wrapper");
const { Scoreboard } = require("../../scoreboard/scoreboard");
const PlayerStrategyCards = require("../../game-data/updator-player-strategy-cards");
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

const PLAYER_NAME_FONT_SIZE = 12;
const PLAYER_NAME_FIT_LENGTH = 15;

const STRATEGY_CARD_FONT_SIZE = 11;
const STRATEGY_CARD_FIT_LENGTH = 13;

class TurnEntryFancy extends Canvas {
    static updateArray(entries, config) {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const passedPlayerSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
        const scoreboard = Scoreboard.getScoreboard();
        const playerSlotToScore = Scoreboard.getPlayerSlotToScore(scoreboard);

        const gameData = {
            players: new Array(world.TI4.config.playerCount)
                .fill(0)
                .map(() => []),
        };
        PlayerStrategyCards(gameData);

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const playerDesk = playerDeskOrder[i];
            const playerSlot = playerDesk?.playerSlot;
            config.isTurn = playerDesk === currentDesk;
            config.isPassed = passedPlayerSlotSet.has(playerSlot);
            config.score = playerSlotToScore[playerSlot] || 0;
            config.strategyCards =
                gameData.players[playerDesk.index]?.strategyCards || [];
            config.strategyCardsFaceDown =
                gameData.players[playerDesk.index]?.strategyCardsFaceDown || [];
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
            .setFontSize(PLAYER_NAME_FONT_SIZE)
            .setBold(true)
            .setText("Player Name");
        this._strategyCards = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(STRATEGY_CARD_FONT_SIZE)
            .setFont("handel-gothic-regular.ttf", refPackageId);
        this._score = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(26)
            .setBold(true)
            .setText("0");

        // Use this to detect if strategy cards needs reset.
        this._strategyCardsKey = undefined;

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
            .addChild(nameBox, 0, 3, w, h / 2)
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
        assert(Array.isArray(config.strategyCards));
        assert(Array.isArray(config.strategyCardsFaceDown));

        const playerSlot = playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);

        let name = player && player.getName();
        if (!name || name.length === 0) {
            name = `<${playerDesk.colorName}>`;
        }
        let fontSizeScale = PLAYER_NAME_FIT_LENGTH / name.length;
        fontSizeScale = Math.min(fontSizeScale, 1);
        fontSizeScale = Math.max(fontSizeScale, 0.5);
        const nameFontSize = PLAYER_NAME_FONT_SIZE * fontSizeScale;

        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        let factionName = faction ? faction.nameAbbr : "—";
        if (factionName.startsWith("Keleres")) {
            factionName = "Keleres";
        }
        factionName = factionName.toUpperCase();
        const factionIcon = faction
            ? faction.icon
            : "global/factions/bobert_icon.png";

        this._factionIcon.setImage(factionIcon, refPackageId);
        this._factionName.setText(factionName);

        this._playerName.setFontSize(nameFontSize).setText(name);
        this._score.setText(config.score.toString());

        // Color.
        const v = 0.02;
        const plrColor = playerDesk.plasticColor;
        const altColor = new Color(v, v, v);

        const fgColor = config.isTurn ? altColor : plrColor;
        const bgColor = config.isTurn ? plrColor : altColor;

        this._factionName.setTextColor(fgColor);
        this._playerName.setTextColor(fgColor);
        this._score.setTextColor(fgColor);
        this._canvasBackground.setColor(bgColor);

        // Strategy cards.
        const MARK_LEFT = "~";
        const MARK_RIGHT = MARK_LEFT;
        let strategyCards = config.strategyCards.map((strategyCard) => {
            if (config.strategyCardsFaceDown.includes(strategyCard)) {
                strategyCard = `${MARK_LEFT}${strategyCard}${MARK_RIGHT}`;
            }
            return strategyCard.toUpperCase();
        });
        if (strategyCards.length === 0) {
            strategyCards.push("—");
        }
        strategyCards = strategyCards.join(" ");

        fontSizeScale = STRATEGY_CARD_FIT_LENGTH / strategyCards.length;
        fontSizeScale = Math.min(fontSizeScale, 1);
        fontSizeScale = Math.max(fontSizeScale, 0.5);
        const strategyCardFontSize = STRATEGY_CARD_FONT_SIZE * fontSizeScale;

        this._strategyCards
            .setFontSize(strategyCardFontSize)
            .setTextColor(fgColor)
            .setText(strategyCards);
    }
}

module.exports = { TurnEntryFancy };
