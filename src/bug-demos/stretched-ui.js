const {
    Border,
    Canvas,
    UIElement,
    Vector,
    refObject,
} = require("@tabletop-playground/api");
const ui = new UIElement();
ui.width = 70; // 70
ui.height = 100;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 6);
ui.widget = new Canvas().addChild(new Border(), 0, 0, ui.width, ui.height);
refObject.addUI(ui);
