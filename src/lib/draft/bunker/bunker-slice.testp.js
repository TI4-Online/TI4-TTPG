const { BunkerSliceUI, DEFAULT_SLICE_SCALE } = require("./bunker-slice-ui");
const {
    Border,
    Canvas,
    Color,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const scale = DEFAULT_SLICE_SCALE;
const { sliceW, sliceH } = BunkerSliceUI.getSize(scale);
console.log(`slice ${sliceW}x${sliceH}`);

const canvas = new Canvas();
const canvasOffset = { x: 0, y: 0 };
const onClicked = (button, player) => {};
const bunkerSliceUI = new BunkerSliceUI(canvas, canvasOffset, scale, onClicked);

const slice = [1, 2, 3, 4];
const color = new Color(1, 0, 0);
const label = "Test Longer Slice Name";
bunkerSliceUI
    .setSlice(slice) //
    .setColor(color)
    .setLabel(label, () => {});

const ui = new UIElement();
ui.width = sliceW;
ui.height = sliceH;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 3);
ui.widget = new Border().setChild(canvas);
ui.scale = 1 / scale;

refObject.addUI(ui);
