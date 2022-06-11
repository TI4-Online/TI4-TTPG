const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Button, LayoutBox, VerticalBox } = require("../../wrapper/api");

class TabStatusUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const dealActionCards = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.deal_action_cards"));
        dealActionCards.onClicked.add(onButtonCallbacks.dealActionCards);

        let box = new LayoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(dealActionCards);
        this.addChild(box);

        const endStatusPhase = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.end_status_phase"));
        endStatusPhase.onClicked.add(onButtonCallbacks.endStatusPhase);

        box = new LayoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(endStatusPhase);
        this.addChild(box);
    }
}

module.exports = { TabStatusUI };
