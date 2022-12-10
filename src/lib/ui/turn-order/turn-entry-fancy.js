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

class TurnEntryFancy extends Canvas {
    static updateArray(entries, config) {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const passedPlayerSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
        const scoreboard = Scoreboard.getScoreboard();
        const playerSlotToScore = scoreboard
            ? Scoreboard.getPlayerSlotToScore(scoreboard)
            : {};

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
        this._playerNameOverlay = new LayoutBox();
        this._playerNameStrike = new Border();

        this._strategyCardSolo = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(STRATEGY_CARD_FONT_SIZE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("CONSTRUCTION");
        this._strategyCardSoloOverlay = new LayoutBox();
        this._strategyCardSoloStrike = new Border();
        this._strategyCardLeft = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(STRATEGY_CARD_FONT_SIZE * 0.6)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("CONSTRUCTION");
        this._strategyCardLeftOverlay = new LayoutBox();
        this._strategyCardLeftStrike = new Border();
        this._strategyCardRight = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(STRATEGY_CARD_FONT_SIZE * 0.6)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("CONSTRUCTION");
        this._strategyCardRightOverlay = new LayoutBox();
        this._strategyCardRightStrike = new Border();

        this._score = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(26)
            .setBold(true)
            .setText("0");

        const nameBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._playerName);
        const strategyBoxSolo = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._strategyCardSolo);

        const strategyBoxLeft = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._strategyCardLeft);
        const strategyBoxRight = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._strategyCardRight);

        const w = 220;
        const h = 58;
        const strike = 1;

        const strikeExtraWidth = 10;
        const strikeLeft = w / 4 - strikeExtraWidth / 2;
        const strikeWidth = w / 2 + strikeExtraWidth;

        this.addChild(this._canvasBackground, 0, 0, w, h)
            .addChild(this._factionIcon, 4, 4, 40, 40)
            .addChild(this._factionName, 0, 44, 48, 15)
            .addChild(this._score, w - 45, 3, 45, 45)
            .addChild(nameBox, 0, 3, w, h / 2)
            .addChild(
                this._playerNameOverlay,
                w / 4,
                h / 4 + 3 - strike,
                w / 2,
                strike
            )
            .addChild(strategyBoxSolo, 0, h / 2 - 4, w, h / 2)
            .addChild(
                this._strategyCardSoloOverlay,
                strikeLeft,
                (h * 3) / 4 - 3 - strike,
                strikeWidth,
                strike
            )
            .addChild(
                strategyBoxLeft,
                strikeLeft,
                h / 2 - 4,
                strikeWidth / 2 - 2,
                h / 2
            )
            .addChild(
                this._strategyCardLeftOverlay,
                strikeLeft,
                (h * 3) / 4 - 4 - strike,
                strikeWidth / 2 - 2,
                strike
            )
            .addChild(
                strategyBoxRight,
                w / 2 + 2,
                h / 2 - 4,
                strikeWidth / 2 - 2,
                h / 2
            )
            .addChild(
                this._strategyCardRightOverlay,
                w / 2 + 2,
                (h * 3) / 4 - 4 - strike,
                strikeWidth / 2 - 2,
                strike
            );
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
        this._playerNameStrike.setColor(fgColor);
        this._score.setTextColor(fgColor);
        this._strategyCardLeftStrike.setColor(fgColor);
        this._strategyCardRightStrike.setColor(fgColor);
        this._strategyCardSoloStrike.setColor(fgColor);

        this._canvasBackground.setColor(bgColor);

        this._playerNameOverlay.setChild(undefined);
        if (config.isPassed) {
            this._playerNameOverlay.setChild(this._playerNameStrike);
        }

        // Strategy cards.
        this._strategyCardSolo.setText("");
        this._strategyCardLeft.setText("");
        this._strategyCardRight.setText("");
        this._strategyCardSoloOverlay.setChild(undefined);
        this._strategyCardLeftOverlay.setChild(undefined);
        this._strategyCardRightOverlay.setChild(undefined);

        if (config.strategyCards.length === 0) {
            this._strategyCardSolo.setText("—");
        } else if (config.strategyCards.length === 1) {
            const name = config.strategyCards[0];
            this._strategyCardSolo
                .setTextColor(fgColor)
                .setText(name.toUpperCase());
            if (config.strategyCardsFaceDown.includes(name)) {
                this._strategyCardSoloOverlay.setChild(
                    this._strategyCardSoloStrike
                );
            }
        } else if (config.strategyCards.length > 1) {
            const name1 = config.strategyCards[0];
            const name2 = config.strategyCards[1];
            this._strategyCardLeft
                .setTextColor(fgColor)
                .setText(name1.toUpperCase());
            if (config.strategyCardsFaceDown.includes(name1)) {
                this._strategyCardLeftOverlay.setChild(
                    this._strategyCardLeftStrike
                );
            }
            this._strategyCardRight
                .setTextColor(fgColor)
                .setText(name2.toUpperCase());
            if (config.strategyCardsFaceDown.includes(name2)) {
                this._strategyCardRightOverlay.setChild(
                    this._strategyCardRightStrike
                );
            }
        }
    }
}

module.exports = { TurnEntryFancy };
