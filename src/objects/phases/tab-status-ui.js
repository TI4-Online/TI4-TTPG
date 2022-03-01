const locale = require("../../lib/locale");
const { Button, VerticalBox } = require("../../wrapper/api");

class TabStatusUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        const dealActionCards = new Button().setText(
            locale("ui.button.deal_action_cards")
        );
        dealActionCards.onClicked.add(onButtonCallbacks.dealActionCards);
        this.addChild(dealActionCards);

        const endStatusPhase = new Button().setText(
            locale("ui.button.end_status_phase")
        );
        endStatusPhase.onClicked.add(onButtonCallbacks.endStatusPhase);
        this.addChild(endStatusPhase);
    }
}

module.exports = { TabStatusUI };
