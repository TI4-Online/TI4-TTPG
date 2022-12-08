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
    refPackageId,
} = require("../../../wrapper/api");

const MAX_PAIR_COUNT = 8;

class TabWhispersUI {
    constructor() {
        this._mainWidget = WidgetFactory.verticalBox();
        this._mainWidget.setChildDistance(CONFIG.spacing);

        // Reserve space for the player a/b labels.
        const labelWeight = 1;
        const windowWeight = 2;

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
            const rowCanvas = WidgetFactory.canvas();

            // Sigh, wrap labels in a right-aligned box.
            const rowLabelsBox = WidgetFactory.layoutBox()
                .setHorizontalAlignment(HorizontalAlignment.Right)
                .setChild(rowLabels);

            // Gross dance to force the window borders to a fixed height.
            const windowInner = WidgetFactory.layoutBox()
                .setOverrideHeight(CONFIG.scale * 30)
                .setChild(rowCanvas);
            const windowOuter = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Center)
                .setChild(windowInner);

            const row = WidgetFactory.horizontalBox()
                .setChildDistance(CONFIG.spacing * 2)
                .addChild(rowLabelsBox, labelWeight)
                .addChild(windowOuter, windowWeight);

            this._mainWidget.addChild(row);

            // Create the window of buckets.  Do not use individual UI, instead
            // overlap two monospace text in a shared canvas.
            const w = 1030; // Yuck, hard coding this requires layout cooperate
            const h = windowInner.getOverrideHeight();
            const fontSize = Math.floor(h * 0.5);
            const textX = h * 0.15;
            const textY = h * 0.16;
            const textH = h - textY * 2;
            const textW = w - textX * 2;
            const bg = WidgetFactory.border().setColor(
                ColorUtil.colorFromHex("#101010")
            );
            const forward = WidgetFactory.text()
                .setFontSize(fontSize)
                .setFont("VT323-Regular.ttf", refPackageId)
                .setText("> ".repeat(30));
            const backward = WidgetFactory.text()
                .setFontSize(fontSize)
                .setFont("VT323-Regular.ttf", refPackageId)
                .setText(" <".repeat(30));
            rowCanvas
                .addChild(bg, 0, 0, w, h)
                .addChild(forward, textX, textY, textW, textH)
                .addChild(backward, textX, textY, textW, textH);

            // Keep references for update.
            this._rows.push({
                label1,
                label2,
                forward,
                backward,
                bucketCount: 60,
            });
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
            const { label1, label2, forward, backward, bucketCount } = row;
            label1.setTextColor([1, 1, 1, 1]).setText("-");
            label2.setTextColor([1, 1, 1, 1]).setText("-");
            forward.setTextColor([1, 1, 1, 1]).setText("-");
            backward.setTextColor([1, 1, 1, 1]).setText("-");

            const whisperPair = whisperPairs[index];
            if (whisperPair) {
                whisperPair.summarizeToText(
                    label1,
                    label2,
                    forward,
                    backward,
                    bucketCount
                );
            }
        });
    }
}

module.exports = { TabWhispersUI };
