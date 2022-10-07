const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { ColorUtil } = require("../../../lib/color/color-util");
const { WhisperHistory } = require("../../../lib/whisper/whisper-history");
const CONFIG = require("../../game-ui-config");
const {
    Border,
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
} = require("../../../wrapper/api");

const MAX_PAIR_COUNT = 8;
const WINDOW_BUCKETS = 60;
const BLACK = ColorUtil.colorFromHex("#101010");

class TabWhispersUI extends VerticalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

        // Reserve space for the player a/b labels.
        const labelWeight = 1;
        const windowWeight = 2.5;

        const headerWindowleft = new Text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Left)
            .setText(locale("ui.whisper.newest"));
        const headerWindowCenter = new Text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.whisper.who_sent"));
        const headerWindowRight = new Text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Right)
            .setText(locale("ui.whisper.oldest"));

        const headerLabels = new HorizontalBox();
        const headerWindow = new HorizontalBox()
            .addChild(headerWindowleft, 1)
            .addChild(headerWindowCenter, 1)
            .addChild(headerWindowRight, 1);
        const header = new HorizontalBox()
            .setChildDistance(CONFIG.spacing * 2)
            .addChild(headerLabels, labelWeight)
            .addChild(headerWindow, windowWeight);

        this.addChild(header);

        this._rows = [];

        for (let window = 0; window < MAX_PAIR_COUNT; window++) {
            const label1 = new Text()
                .setFontSize(CONFIG.fontSize)
                .setText("purple");
            const slash = new Text().setFontSize(CONFIG.fontSize).setText("/");
            const label2 = new Text()
                .setFontSize(CONFIG.fontSize)
                .setText("yellow");

            const rowLabels = new HorizontalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(label1)
                .addChild(slash)
                .addChild(label2);
            const rowWindow = new HorizontalBox().setChildDistance(
                CONFIG.scale * 2
            );

            // Sigh, wrap labels in a right-aligned box.
            const rowLabelsBox = new LayoutBox()
                .setHorizontalAlignment(HorizontalAlignment.Right)
                .setChild(rowLabels);

            // Gross dance to force the window borders to a fixed height.
            const windowInner = new LayoutBox()
                .setOverrideHeight(CONFIG.scale * 10)
                .setChild(rowWindow);
            const windowOuter = new LayoutBox()
                .setVerticalAlignment(VerticalAlignment.Center)
                .setChild(windowInner);

            const row = new HorizontalBox()
                .setChildDistance(CONFIG.spacing * 2)
                .addChild(rowLabelsBox, labelWeight)
                .addChild(windowOuter, windowWeight);

            this
                //.addChild(new Border().setColor(CONFIG.spacerColor)) // spacer
                .addChild(row);

            // Create the window of buckets.
            const window = [];
            for (let bucket = 0; bucket < WINDOW_BUCKETS; bucket++) {
                const border = new Border().setColor(BLACK);
                window.push(border);
                rowWindow.addChild(border, 1);
            }

            // Keep references for update.
            this._rows.push({ label1, label2, window });
        }

        this.update();
    }

    update() {
        const whisperPairs = WhisperHistory.getAllInUpdateOrder();
        assert(Array.isArray(whisperPairs));

        this._rows.forEach((row, index) => {
            const { label1, label2, window } = row;
            label1.setText("-");
            label2.setText("-");
            label1.setTextColor([1, 1, 1, 1]);
            label2.setTextColor([1, 1, 1, 1]);
            for (const border of window) {
                border.setColor(BLACK);
            }

            const whisperPair = whisperPairs[index];
            if (whisperPair) {
                whisperPair.summarizeToBorders(label1, label2, window, BLACK);
            }
        });
    }
}

module.exports = { TabWhispersUI };
