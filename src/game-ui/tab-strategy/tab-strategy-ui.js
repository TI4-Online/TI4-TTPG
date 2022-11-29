const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

class TabStrategyUI {
    constructor(onButtonCallbacks) {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const placeTgsButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.place_trade_goods_and_set_turns"));
        placeTgsButton.onClicked.add(
            onButtonCallbacks.placeTradeGoodsAndSetTurns
        );

        const box = WidgetFactory.layoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(placeTgsButton);

        this._verticalBox.addChild(box);
    }

    getWidget() {
        return this._verticalBox;
    }
}

module.exports = { TabStrategyUI };
