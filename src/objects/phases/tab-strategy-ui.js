const locale = require("../../lib/locale");
const { Button, VerticalBox } = require("../../wrapper/api");

class TabStrategyUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        const placeTgsButton = new Button().setText(
            locale("ui.button.place_trade_goods_and_set_turns")
        );
        placeTgsButton.onClicked.add(
            onButtonCallbacks.placeTradeGoodsAndSetTurns
        );

        this.addChild(placeTgsButton);
    }
}

module.exports = { TabStrategyUI };
