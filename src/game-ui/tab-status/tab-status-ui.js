const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Button, VerticalBox } = require("../../wrapper/api");

class TabStatusUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const dealActionCards = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.deal_action_cards"));
        dealActionCards.onClicked.add(onButtonCallbacks.dealActionCards);
        this.addChild(dealActionCards);

        const endStatusPhase = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.end_status_phase"));
        endStatusPhase.onClicked.add(onButtonCallbacks.endStatusPhase);
        this.addChild(endStatusPhase);
    }
}

module.exports = { TabStatusUI };
