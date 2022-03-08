const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { MiltyDraftUI } = require("./milty-draft-ui");
const {
    Canvas,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const scale = 10;
const [w, h] = MiltyDraftUI.getSize(scale);
console.log(`draft ${w}x${h}`);

const canvas = new Canvas();
const canvasOffset = { x: 0, y: 0 };
const miltyDraftUI = new MiltyDraftUI(canvas, canvasOffset, scale);

const ui = new UIElement();
ui.width = w;
ui.height = h;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 6);
ui.widget = canvas;
ui.scale = 1 / scale;

refObject.addUI(ui);
