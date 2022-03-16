const CONFIG = require("../game-ui-config");
const { Text, VerticalBox } = require("../../wrapper/api");
const locale = require("../../lib/locale");

class TabHelpUI extends VerticalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

        this.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.help.numpad"))
        );

        const numpadStrs = [
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
        this.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(numpadStrs.join("\n"))
        );
    }
}

module.exports = { TabHelpUI };
