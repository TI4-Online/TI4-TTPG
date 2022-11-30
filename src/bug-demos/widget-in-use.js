const {
    Button,
    LayoutBox,
    UIElement,
    Vector,
    world,
} = require("@tabletop-playground/api");

// Place a button inside a box.
const button = new Button();
const box = new LayoutBox().setChild(button);
let ui;

// Add box to world.
ui = new UIElement();
ui.position = new Vector(0, 0, world.getTableHeight() + 5);
ui.widget = box;
world.addUI(ui);

// Clear the box
box.setChild(undefined);

// Add released button to world.
ui = new UIElement();
ui.position = new Vector(0, 5, world.getTableHeight() + 5);
ui.widget = button;
world.addUI(ui); // Error: Can't add global Widget: already attached!
