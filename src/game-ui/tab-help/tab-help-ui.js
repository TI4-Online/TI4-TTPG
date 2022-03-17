const CONFIG = require("../game-ui-config");
const { HorizontalBox, Text, VerticalBox } = require("../../wrapper/api");
const locale = require("../../lib/locale");

class TabHelpUI extends HorizontalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

        let panel = new VerticalBox().setChildDistance(CONFIG.spacing);
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
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(numpadStrs.join("\n"))
        );

        panel = new VerticalBox().setChildDistance(CONFIG.spacing);
        this.addChild(panel, 1);

        panel.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.help.alt_zoom_ground"))
        );
    }
}

module.exports = { TabHelpUI };
