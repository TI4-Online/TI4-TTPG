const locale = require("../../lib/locale");
const { Button, Text, VerticalBox } = require("../../wrapper/api");

class TabStrategyUI extends VerticalBox {
    constructor() {
        super();

        this.addChild(
            new Text().setText(locale("ui.phase.strategy.pick_strategy_cards"))
        );
        this.addChild(
            new Button().setText(
                locale("ui.phase.strategy.place_tradegoods_and_set_turns")
            )
        );
    }
}

module.exports = { TabStrategyUI };
