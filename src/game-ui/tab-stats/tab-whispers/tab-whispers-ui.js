const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { ColorUtil } = require("../../../lib/color/color-util");
const { WhisperHistory } = require("../../../lib/whisper/whisper-history");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");
const CONFIG = require("../../game-ui-config");
const {
    HorizontalAlignment,
    TextJustification,
    VerticalAlignment,
} = require("../../../wrapper/api");

const MAX_PAIR_COUNT = 8;
const WINDOW_BUCKETS = 60;
const BLACK = ColorUtil.colorFromHex("#101010");

class TabWhispersUI {
    constructor() {
        this._mainWidget = WidgetFactory.verticalBox();
        this._mainWidget.setChildDistance(CONFIG.spacing);

        // Reserve space for the player a/b labels.
        const labelWeight = 1;
        const windowWeight = 2.5;

        const headerWindowleft = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Left)
            .setText(locale("ui.whisper.newest"));
        const headerWindowCenter = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.whisper.who_sent"));
        const headerWindowRight = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Right)
            .setText(locale("ui.whisper.oldest"));

        const headerLabels = WidgetFactory.horizontalBox();
        const headerWindow = WidgetFactory.horizontalBox()
            .addChild(headerWindowleft, 1)
            .addChild(headerWindowCenter, 1)
            .addChild(headerWindowRight, 1);
        const header = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing * 2)
            .addChild(headerLabels, labelWeight)
            .addChild(headerWindow, windowWeight);

        this._mainWidget.addChild(header);

        this._rows = [];

        for (let window = 0; window < MAX_PAIR_COUNT; window++) {
            const label1 = WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setText("purple");
            const slash = WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setText("/");
            const label2 = WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setText("yellow");

            const rowLabels = WidgetFactory.horizontalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(label1)
                .addChild(slash)
                .addChild(label2);
            const rowWindow = WidgetFactory.horizontalBox().setChildDistance(
                CONFIG.scale * 2
            );

            // Sigh, wrap labels in a right-aligned box.
            const rowLabelsBox = WidgetFactory.layoutBox()
                .setHorizontalAlignment(HorizontalAlignment.Right)
                .setChild(rowLabels);

            // Gross dance to force the window borders to a fixed height.
            const windowInner = WidgetFactory.layoutBox()
                .setOverrideHeight(CONFIG.scale * 10)
                .setChild(rowWindow);
            const windowOuter = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Center)
                .setChild(windowInner);

            const row = WidgetFactory.horizontalBox()
                .setChildDistance(CONFIG.spacing * 2)
                .addChild(rowLabelsBox, labelWeight)
                .addChild(windowOuter, windowWeight);

            this._mainWidget.addChild(row);

            // Create the window of buckets.
            const window = [];
            for (let bucket = 0; bucket < WINDOW_BUCKETS; bucket++) {
                const border = WidgetFactory.border().setColor(BLACK);
                window.push(border);
                rowWindow.addChild(border, 1);
            }

            // Keep references for update.
            this._rows.push({ label1, label2, window });
        }

        this.update();
    }

    getWidget() {
        return this._mainWidget;
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
