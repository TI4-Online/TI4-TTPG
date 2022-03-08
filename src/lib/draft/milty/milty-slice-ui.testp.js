const { MiltySliceUI } = require("./milty-slice-ui");
const { Color, UIElement, Vector, refObject } = require("../../../wrapper/api");

const miltySliceString = "1 2 3 4 5";
const color = new Color(1, 0, 0);
const label = "Te\nst";
const SCALE = 20;
const ui = new UIElement();
ui.position = new Vector(0, 0, 3);
ui.widget = new MiltySliceUI(SCALE).setSlice(miltySliceString, color, label);
ui.scale = 1 / SCALE;

refObject.addUI(ui);
