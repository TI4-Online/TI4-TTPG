const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const { CheckBox, VerticalBox } = require("../../../wrapper/api");

class TabFogOfWarUI extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const enableFog = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.fog.enable"));
        assert(typeof onClickHandlers.toggleEnable === "function");
        enableFog.onCheckStateChanged.add(onClickHandlers.toggleEnable);

        this.addChild(enableFog);
    }
}

module.exports = { TabFogOfWarUI };
