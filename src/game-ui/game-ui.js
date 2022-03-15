/**
 * Attach Game UI to world.
 */
const { TableLayout } = require("../table/table-layout");
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
const { TurnOrderPanel } = require("../lib/ui/turn-order-panel");
const { TabbedPanel } = require("../lib/ui/tabbed-panel");

class GameUI {
    constructor() {
        const anchor = TableLayout.anchor.gameUI;

        this._layout = new LayoutBox().setPadding(
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding
        );

        this._uiElement = new UIElement();
        this._uiElement.useWidgetSize = false;
        this._uiElement.width = anchor.width;
        this._uiElement.height = anchor.height;
        this._uiElement.anchorY = 0;
        this._uiElement.position = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 0.01
        );
        this._uiElement.rotation = new Rotator(0, anchor.yaw, 0);
        this._uiElement.widget = new Border().setChild(this._layout);

        world.addUI(this._uiElement);
    }

    fill() {
        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);
        this._layout.setChild(panel);

        const turnOrderPanel = new TurnOrderPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);
        panel.addChild(turnOrderPanel);

        const tabbedPanel = new TabbedPanel().setFontSize(CONFIG.fontSize);
        panel.addChild(tabbedPanel);

        tabbedPanel.addTab("test", new Text().setText("foo"));
    }
}

const gameUI = new GameUI();
process.nextTick(() => {
    gameUI.fill();
});
