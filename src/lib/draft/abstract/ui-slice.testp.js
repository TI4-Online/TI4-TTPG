const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { UiSlice } = require("./ui-slice");
const { SLICE_SHAPES } = require("./abstract-slice-generator");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");
const { UiDraftChoice } = require("./ui-draft-choice");

const ADD_HEX_LABELS = false;

// Visualize hex strings at hex positions.
if (ADD_HEX_LABELS) {
    for (let i = 0; i < 90; i++) {
        const hex = MapStringHex.idxToHexString(i);
        const pos = Hex.toPosition(hex);
        pos.z = world.getTableHeight() + 0.1;
        const label = world.createLabel(pos);
        label.setRotation([-90, 0, 0]);
        label.setScale(0.8);
        label.setText(hex);
    }
}

function miltySlice() {
    const shape = SLICE_SHAPES.milty;
    const slice = [
        // use systems that create a long summary string for sizing
        19, // yellow skip
        21, // blue skip
        22, // green skip
        65, // legendary
        25, // wormhole
    ];

    const scale = 10;
    const uiSlice = new UiSlice()
        .setLabel("Demo Slice")
        .setScale(scale)
        .setShape(shape) // array of hex strings
        .setSlice(slice); // systems in shape order (excluding home)

    const size = uiSlice.getSize();
    console.log(JSON.stringify(size));

    //const widget = new Border().setChild(uiSlice.createWidget());
    const widget = new UiDraftChoice(uiSlice).setScale(scale).createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = widget;

    refObject.addUI(ui);
}

miltySlice();
