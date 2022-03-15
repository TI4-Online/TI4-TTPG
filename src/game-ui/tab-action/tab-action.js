const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");
const { Border, Button, VerticalBox, world } = require("../../wrapper/api");

class TabAction {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        const tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        tabbedPanel.addTab(
            locale("ui.tab.tactical_action"),
            new Border(),
            true
        );

        tabbedPanel.addTab(locale("ui.tab.strategic_action"), new Border());

        tabbedPanel.addTab(locale("ui.tab.component_action"), new Border());

        const verticalBox = new VerticalBox().setChildDistance(CONFIG.spacing);
        verticalBox.addChild(tabbedPanel);

        const endTurn = new Button()
            .setFontSize(CONFIG.fontSize * 2)
            .setText(locale("ui.action.end_turn"));
        endTurn.onClicked.add((button, player) => {
            world.TI4.turns.endTurn(player);
        });
        verticalBox.addChild(endTurn);

        this._ui = verticalBox;
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabAction };
