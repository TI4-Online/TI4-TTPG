const CONFIG = require("../game-ui-config");
const { HorizontalBox, Text, VerticalBox } = require("../../wrapper/api");
const locale = require("../../lib/locale");

const HELP_FONTSIZE = CONFIG.fontSize * 0.9;
const PARAGRAPH_SPACING = HELP_FONTSIZE * 0.8;

class TabHelpUI extends HorizontalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

        let panel = new VerticalBox().setChildDistance(PARAGRAPH_SPACING);
        this.addChild(panel, 1);

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
            new Text().setFontSize(HELP_FONTSIZE).setText(numpadStrs.join("\n"))
        );

        panel = new VerticalBox().setChildDistance(PARAGRAPH_SPACING);
        this.addChild(panel, 1);

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
            new Text()
                .setFontSize(HELP_FONTSIZE)
                .setText(ttpgKeyStrings.join("\n"))
        );

        panel.addChild(
            new Text()
                .setFontSize(HELP_FONTSIZE)
                .setText(locale("ui.help.alt_zoom_ground"))
                .setAutoWrap(true)
        );

        panel.addChild(
            new Text()
                .setFontSize(HELP_FONTSIZE)
                .setText(locale("ui.help.whisper"))
                .setAutoWrap(true)
        );
    }
}

module.exports = { TabHelpUI };
