const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Button, LayoutBox, VerticalBox } = require("../../wrapper/api");

class TabStrategyUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const placeTgsButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.place_trade_goods_and_set_turns"));
        placeTgsButton.onClicked.add(
            onButtonCallbacks.placeTradeGoodsAndSetTurns
        );

        const box = new LayoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(placeTgsButton);

        this.addChild(box);
    }
}

module.exports = { TabStrategyUI };
