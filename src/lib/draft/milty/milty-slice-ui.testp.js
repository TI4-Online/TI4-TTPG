const { MiltySliceUI, DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const {
    Canvas,
    Color,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const miltySliceString = "1 2 3 4 5";
const color = new Color(1, 0, 0);
const label = "Test";
const miltySlice = new MiltySliceUI().setSlice(miltySliceString, color, label);

const [w, h] = MiltySliceUI.getSize();
const canvas = new Canvas();
canvas.addChild(miltySlice, 0, 0, w, h);

const ui = new UIElement();
ui.width = w;
ui.height = h;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 3);
ui.widget = canvas;
ui.scale = 1 / DEFAULT_SLICE_SCALE;

refObject.addUI(ui);
