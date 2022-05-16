const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Button, VerticalBox } = require("../../wrapper/api");

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

        this.addChild(placeTgsButton);
    }
}

module.exports = { TabStrategyUI };
