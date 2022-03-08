const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { MiltyDraftUI } = require("./milty-draft-ui");
const {
    Canvas,
    Color,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const scale = DEFAULT_SLICE_SCALE;
const [w, h] = MiltyDraftUI.getSize(scale);
console.log(`draft ${w}x${h}`);

const canvas = new Canvas();
const canvasOffset = { x: 0, y: 0 };
const miltyDraftUI = new MiltyDraftUI(canvas, canvasOffset, scale);

miltyDraftUI
    .setSlices([
        {
            slice: [1, 2, 3, 4, 5],
            color: new Color(1, 0, 0),
            label: "Slice A",
        },
        {
            slice: [6, 7, 8, 9, 10],
            color: new Color(0, 1, 0),
            label: "Slice B",
        },
        {
            slice: [11, 12, 13, 14, 15],
            color: new Color(0, 0, 1),
            label: "Slice C",
        },
    ])
    .setFactions(["arborec", "ul"])
    .setSpeakerSeatIndex(2);

const ui = new UIElement();
ui.width = w;
ui.height = h;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 6);
ui.widget = canvas;
ui.scale = 1 / scale;

refObject.addUI(ui);
