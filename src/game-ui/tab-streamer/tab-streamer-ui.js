const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    TextJustification,
    VerticalAlignment,
    world,
} = require("../../wrapper/api");

class TabStreamerUI {
    constructor(onClickHandlers) {
        assert(typeof onClickHandlers.toggleHideCursor === "function");
        assert(typeof onClickHandlers.buddy === "function");

        const descFontSize = Math.floor(CONFIG.fontSize * 0.7);

        const topRow = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );
        const botRow = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );
        this._panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(topRow, 1)
            .addChild(botRow, 1);

        {
            const descGameTimestamp = WidgetFactory.text()
                .setAutoWrap(true)
                .setFontSize(descFontSize)
                .setJustification(TextJustification.Center)
                .setText(locale("streamer.desc.timestamp"));
            const boxGameTimestamp = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Bottom)
                .setChild(descGameTimestamp);
            this._gameTimestamp = WidgetFactory.textBox()
                .setFontSize(CONFIG.fontSize)
                .setSelectTextOnFocus(true)
                .setText("-");
            this._gameTimestamp.onTextCommitted.add(() => {
                this.update();
            });
            const entryGameTimestamp = WidgetFactory.verticalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(boxGameTimestamp, 1)
                .addChild(this._gameTimestamp, 1);
            topRow.addChild(entryGameTimestamp, 1);
        }
        {
            const descToggleHideCursor = WidgetFactory.text()
                .setAutoWrap(true)
                .setFontSize(descFontSize)
                .setJustification(TextJustification.Center)
                .setText(locale("streamer.desc.toggle_hide_cursor"));
            const boxToggleHideCursor = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Bottom)
                .setChild(descToggleHideCursor);
            const buttonToggleHideCursor = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("streamer.button.toggle_hide_cursor"));
            buttonToggleHideCursor.onClicked.add(
                ThrottleClickHandler.wrap(onClickHandlers.toggleHideCursor)
            );
            const entryToggleHideCursor = WidgetFactory.verticalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(boxToggleHideCursor, 1)
                .addChild(buttonToggleHideCursor, 1);
            topRow.addChild(entryToggleHideCursor, 1);
        }
        {
            const descBuddy = WidgetFactory.text()
                .setAutoWrap(true)
                .setFontSize(descFontSize)
                .setJustification(TextJustification.Center)
                .setText(locale("streamer.desc.buddy"));
            const boxBuddy = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Bottom)
                .setChild(descBuddy);
            const buttonBuddy = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("streamer.button.buddy"));
            buttonBuddy.onClicked.add(
                ThrottleClickHandler.wrap(onClickHandlers.buddy)
            );
            const entryBuddy = WidgetFactory.verticalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(boxBuddy, 1)
                .addChild(buttonBuddy, 1);
            topRow.addChild(entryBuddy, 1);
        }
        {
            const descAutoStreamerCamera = WidgetFactory.text()
                .setAutoWrap(true)
                .setFontSize(descFontSize)
                .setJustification(TextJustification.Center)
                .setText(locale("streamer.desc.auto_streamer_camear"));
            const boxAutoStreamerCamera = WidgetFactory.layoutBox()
                .setVerticalAlignment(VerticalAlignment.Bottom)
                .setChild(descAutoStreamerCamera);
            const buttonAutoStreamerCamera = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("streamer.button.auto_streamer_camear"));
            buttonAutoStreamerCamera.onClicked.add(
                ThrottleClickHandler.wrap(onClickHandlers.autoStreamerCamera)
            );
            const entryAutoStreamerCamera = WidgetFactory.verticalBox()
                .setChildDistance(CONFIG.spacing)
                .addChild(boxAutoStreamerCamera, 1)
                .addChild(buttonAutoStreamerCamera, 1);
            botRow.addChild(entryAutoStreamerCamera, 1);
        }

        // Reserved for future use.
        botRow.addChild(WidgetFactory.layoutBox(), 1);
        botRow.addChild(WidgetFactory.layoutBox(), 1);

        this.update();
    }

    getWidget() {
        return this._panel;
    }

    update() {
        const timestamp = Math.floor(world.TI4.config.timestamp * 100) / 100;
        this._gameTimestamp.setText(`${timestamp}`);
        return this;
    }
}

module.exports = { TabStreamerUI };
