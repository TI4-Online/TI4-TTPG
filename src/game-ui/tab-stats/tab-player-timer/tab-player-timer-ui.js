const assert = require("../../../wrapper/assert-wrapper");
const { PlayerTimer } = require("../../../lib/player-timer/player-timer");
const CONFIG = require("../../game-ui-config");
const {
    Border,
    HorizontalBox,
    Text,
    TextJustification,
    VerticalBox,
    world,
} = require("../../../wrapper/api");

const MAX_ROUNDS = 7;
const FONT_SIZE = CONFIG.fontSize * 0.7;

class TabPlayerTimerUI {
    static formatTime(totalSeconds) {
        assert(typeof totalSeconds === "number");

        if (totalSeconds <= 0) {
            return "-";
        }

        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = Math.floor(totalSeconds % 60);

        hours = String(hours).padStart(1, "0");
        minutes = String(minutes).padStart(2, "0");
        seconds = String(seconds).padStart(2, "0");

        if (hours > 0) {
            return `${hours}:${minutes}:${seconds}`;
        } else {
            return `${minutes}:${seconds}`;
        }
    }

    constructor() {
        this._colorToRoundToText = {}; // round 0 is label

        this._heading = new Text()
            .setJustification(TextJustification.Center)
            .setFontSize(FONT_SIZE);
        const colPanel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this._roundToTotalTime = {};

        this._widget = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._heading)
            .addChild(colPanel);

        for (let round = 0; round < MAX_ROUNDS + 1; round++) {
            const col = new VerticalBox().setChildDistance(CONFIG.spacing);
            if (round % 2 === 1) {
                const border = new Border()
                    .setColor(CONFIG.darkerColor)
                    .setChild(col);
                colPanel.addChild(border, 1);
            } else {
                colPanel.addChild(col, 1);
            }

            // Col header.
            const label = round > 0 ? round : "ROUND";
            const headerText = new Text()
                .setFontSize(FONT_SIZE)
                .setJustification(
                    round > 0
                        ? TextJustification.Center
                        : TextJustification.Left
                )
                .setText(label);
            col.addChild(headerText);

            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const colorName = playerDesk.colorName;
                const text = new Text()
                    .setFontSize(FONT_SIZE)
                    .setTextColor(playerDesk.widgetColor);
                col.addChild(text);

                if (round === 0) {
                    text.setText(colorName);
                } else {
                    text.setJustification(TextJustification.Center).setText(
                        "0:00:00"
                    );
                }

                if (round > 0) {
                    let roundToText = this._colorToRoundToText[colorName];
                    if (!roundToText) {
                        roundToText = {};
                        this._colorToRoundToText[colorName] = roundToText;
                    }
                    roundToText[round] = text;
                }
            }

            const totalRoundTime = new Text().setFontSize(FONT_SIZE);
            if (round > 0) {
                totalRoundTime.setJustification(TextJustification.Center);
                this._roundToTotalTime[round] = totalRoundTime;
            } else {
                totalRoundTime.setText("TOTAL");
            }
            col.addChild(totalRoundTime);
        }
    }

    getWidget() {
        return this._widget;
    }

    update(playerTimer) {
        assert(playerTimer instanceof PlayerTimer);

        const whyPaused = playerTimer.getWhyPaused();
        const text = whyPaused.length > 0 ? whyPaused : "Action Phase Time";
        this._heading.setText(text);

        const roundToSeconds = {};

        for (const [colorName, roundToText] of Object.entries(
            this._colorToRoundToText
        )) {
            for (const [round, text] of Object.entries(roundToText)) {
                const roundNumber = Number.parseInt(round);
                const totalSeconds = playerTimer.getPlayerTimeSeconds(
                    colorName,
                    roundNumber
                );
                const time = TabPlayerTimerUI.formatTime(totalSeconds);
                text.setText(time);

                roundToSeconds[round] =
                    (roundToSeconds[round] ?? 0) + totalSeconds;
            }
        }

        // Fill in the overall round time.
        for (const [round, text] of Object.entries(this._roundToTotalTime)) {
            const seconds = roundToSeconds[round] ?? 0;
            const time = TabPlayerTimerUI.formatTime(seconds);
            text.setText(seconds > 0 ? time : "-");
        }
    }
}

module.exports = { TabPlayerTimerUI };
