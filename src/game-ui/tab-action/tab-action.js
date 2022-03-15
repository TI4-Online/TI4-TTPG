const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRoller } = require("../../objects/roller/auto-roller");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");
const { Button, Text, VerticalBox, world } = require("../../wrapper/api");

class TabAction {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        const tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const autoRoller = new AutoRoller();
        autoRoller.getUI().setDoRefresh(doRefresh);

        // const systemImg = new ImageWidget().setImage(
        //     "locale/ui/tiles/base/special/tile_018.png",
        //     refPackageId
        // );
        // const systemBox = new LayoutBox()
        //     .setChild(systemImg)
        //     .setOverrideHeight(300)
        //     .setOverrideWidth(300);
        // const tacticalPanel = new HorizontalBox()
        //     .addChild(autoRoller.getUI())
        //     .addChild(systemBox);

        tabbedPanel.addTab(
            locale("ui.tab.tactical_action"),
            autoRoller.getUI(),
            true
        );

        tabbedPanel.addTab(
            locale("ui.tab.strategic_action"),
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.strategy.instructions"))
        );

        tabbedPanel.addTab(
            locale("ui.tab.component_action"),
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.component.instructions"))
        );

        const verticalBox = new VerticalBox().setChildDistance(CONFIG.spacing);
        verticalBox.addChild(tabbedPanel);

        const endTurn = new Button()
            .setFontSize(CONFIG.fontSize * 2)
            .setText(locale("ui.action.end_turn"));
        endTurn.onClicked.add((button, player) => {
            world.TI4.turns.endTurn(player);
        });
        verticalBox.addChild(endTurn, 1);

        this._ui = verticalBox;
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabAction };
