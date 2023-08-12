const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");
const { world } = require("../../../wrapper/api");

class TabFogOfWarUI {
    constructor(onClickHandlers) {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const enableFog = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.fog.enable"))
            .setIsChecked(world.TI4.fogOfWar.isEnabled());
        assert(typeof onClickHandlers.toggleEnable === "function");
        enableFog.onCheckStateChanged.add(onClickHandlers.toggleEnable);

        this._verticalBox.addChild(enableFog);

        this._verticalBox.addChild(
            WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.tab.map.fog.description"))
                .setAutoWrap(true)
        );
    }

    getWidget() {
        return this._verticalBox;
    }
}

module.exports = { TabFogOfWarUI };
