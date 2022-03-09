const { MiltySliceUI, DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const {
    Canvas,
    Color,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const scale = DEFAULT_SLICE_SCALE;
const { sliceW, sliceH } = MiltySliceUI.getSize(scale);
console.log(`slice ${sliceW}x${sliceH}`);

const canvas = new Canvas();
const canvasOffset = { x: 0, y: 0 };
const onClicked = (button, player) => {};
const miltySliceUI = new MiltySliceUI(canvas, canvasOffset, scale, onClicked);

const slice = [1, 2, 3, 4, 5];
const color = new Color(1, 0, 0);
const label = "Test Longer Slice Name";
miltySliceUI.setSlice(slice, color, label);

const ui = new UIElement();
ui.width = sliceW;
ui.height = sliceH;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 3);
ui.widget = canvas;
ui.scale = 1 / scale;

refObject.addUI(ui);
