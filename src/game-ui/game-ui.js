/**
 * Attach Game UI to world.
 */
const { TableLayout } = require("../table/table-layout");
const {
    Border,
    Rotator,
    Text,
    UIElement,
    Vector,
    world,
} = require("../wrapper/api");

const anchor = TableLayout.anchor.gameUI;

const _border = new Border().setChild(
    new Text().setText("HELLO").setFontSize(40)
);

const _uiElement = new UIElement();
_uiElement.useWidgetSize = false;
_uiElement.width = anchor.width;
_uiElement.height = anchor.height;
_uiElement.anchorY = 0;
_uiElement.position = new Vector(
    anchor.pos.x,
    anchor.pos.y,
    world.getTableHeight() + 0.01
);
_uiElement.rotation = new Rotator(0, anchor.yaw, 0);
_uiElement.widget = _border;

world.addUI(_uiElement);
