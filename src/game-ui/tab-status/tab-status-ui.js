const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

class TabStatusUI {
    constructor(onButtonCallbacks) {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const dealActionCards = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.deal_action_cards"));
        dealActionCards.onClicked.add(onButtonCallbacks.dealActionCards);

        let box = WidgetFactory.layoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(dealActionCards);
        this._verticalBox.addChild(box);

        const endStatusPhase = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.end_status_phase"));
        endStatusPhase.onClicked.add(onButtonCallbacks.endStatusPhase);

        box = WidgetFactory.layoutBox()
            .setMinimumHeight(CONFIG.fontSize * 4)
            .setChild(endStatusPhase);
        this._verticalBox.addChild(box);
    }

    getWidget() {
        return this._verticalBox;
    }
}

module.exports = { TabStatusUI };
