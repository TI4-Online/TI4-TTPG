const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const { CheckBox, VerticalBox } = require("../../../wrapper/api");

class TabBordersUI extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const enableBorders = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.borders.enable"));
        assert(typeof onClickHandlers.toggleBorders === "function");
        enableBorders.onCheckStateChanged.add(onClickHandlers.toggleBorders);

        this.addChild(enableBorders);
    }
}

module.exports = { TabBordersUI };
