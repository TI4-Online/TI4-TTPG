const {
    RichText,
    UIElement,
    Vector,
    world,
} = require("@tabletop-playground/api");

const richText = new RichText().setText(
    "[color=#e0e0e0]0[/color] | [color=#07b2ff]0[/color] | [color=#7500b7]0*[/color] | [color=#d7b700]0[/color] | [color=#cb0000]0[/color] | [color=#007406]0[/color]"
);

const ui = new UIElement();
ui.position = new Vector(0, 0, world.getTableHeight() + 3);
ui.widget = richText;

world.addUI(ui);
