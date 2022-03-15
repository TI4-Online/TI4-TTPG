/**
 * Attach Game UI to world.
 */
const locale = require("../lib/locale");
const { TabbedPanel } = require("../lib/ui/tabbed-panel");
const { TableLayout } = require("../table/table-layout");
const { TabMap } = require("./tab-map/tab-map");
const { TabStrategy } = require("./tab-strategy/tab-strategy");
const { TabStatus } = require("./tab-status/tab-status");
const { TurnOrderPanel } = require("../lib/ui/turn-order-panel");
const CONFIG = require("./game-ui-config");
const {
    Border,
    LayoutBox,
    Rotator,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("../wrapper/api");

class GameUI {
    constructor() {
        const anchor = TableLayout.anchor.gameUI;

        this._layout = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setMinimumWidth(anchor.width)
            .setMinimumHeight(anchor.height);

        this._uiElement = new UIElement();
        this._uiElement.anchorY = 0;
        this._uiElement.position = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 0.01
        );
        this._uiElement.rotation = new Rotator(0, anchor.yaw, 0);
        this._uiElement.widget = new Border().setChild(this._layout);

        this._doRefresh = () => {
            world.updateUI(this._uiElement);
        };

        world.addUI(this._uiElement);
    }

    fill() {
        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);
        this._layout.setChild(panel);

        const turnOrderPanel = new TurnOrderPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);
        panel.addChild(turnOrderPanel);

        const tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);
        panel.addChild(tabbedPanel);

        const tabMap = new TabMap(this._doRefresh);
        tabbedPanel.addTab(locale("ui.tab.map"), tabMap.getUI());

        const tabStrategy = new TabStrategy();
        tabbedPanel.addTab(
            locale("ui.tab.strategy_phase"),
            tabStrategy.getUI()
        );

        const tabStatus = new TabStatus();
        tabbedPanel.addTab(locale("ui.tab.status_phase"), tabStatus.getUI());

        //.addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())

        tabbedPanel.addTab(
            locale("ui.tab.agenda_phase"),
            new Text().setText("< work in progress >")
        );
    }
}

const gameUI = new GameUI();
process.nextTick(() => {
    gameUI.fill();
});