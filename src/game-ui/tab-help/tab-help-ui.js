const CONFIG = require("../game-ui-config");
const locale = require("../../lib/locale");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

const HELP_FONTSIZE = CONFIG.fontSize * 0.9;
const PARAGRAPH_SPACING = HELP_FONTSIZE * 0.8;

class TabHelpUI {
    constructor() {
        this._horizontalBox = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );

        let panel =
            WidgetFactory.verticalBox().setChildDistance(PARAGRAPH_SPACING);
        this._horizontalBox.addChild(panel, 1);

        const numpadStrs = [
            locale("ui.help.numpad"),
            locale("ui.help.numpad.1"),
            locale("ui.help.numpad.2"),
            locale("ui.help.numpad.3"),
            locale("ui.help.numpad.4"),
            locale("ui.help.numpad.5"),
            locale("ui.help.numpad.6"),
            locale("ui.help.numpad.7"),
            locale("ui.help.numpad.8"),
            locale("ui.help.numpad.9"),
            locale("ui.help.numpad.0"),
        ];
        panel.addChild(
            WidgetFactory.text()
                .setFontSize(HELP_FONTSIZE)
                .setText(numpadStrs.join("\n"))
        );

        panel = WidgetFactory.verticalBox().setChildDistance(PARAGRAPH_SPACING);
        this._horizontalBox.addChild(panel, 1);

        const ttpgKeyStrings = [
            locale("ui.help.ttpg"),
            locale("ui.help.ttpg.f"),
            locale("ui.help.ttpg.r"),
            locale("ui.help.ttpg.r2"),
            locale("ui.help.ttpg.r3"),
            locale("ui.help.ttpg.number"),
            locale("ui.help.ttpg.alt"),
            locale("ui.help.ttpg.alt_shift"),
        ];
        panel.addChild(
            WidgetFactory.text()
                .setFontSize(HELP_FONTSIZE)
                .setText(ttpgKeyStrings.join("\n"))
        );

        panel.addChild(
            WidgetFactory.text()
                .setFontSize(HELP_FONTSIZE)
                .setText(locale("ui.help.alt_zoom_ground"))
                .setAutoWrap(true)
        );

        panel.addChild(
            WidgetFactory.text()
                .setFontSize(HELP_FONTSIZE)
                .setText(locale("ui.help.whisper"))
                .setAutoWrap(true)
        );
    }

    getWidget() {
        return this._horizontalBox;
    }
}

module.exports = { TabHelpUI };
