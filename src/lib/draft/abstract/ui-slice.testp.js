const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { UiSlice } = require("./ui-slice");
const { SLICE_SHAPES } = require("./abstract-slice-generator");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");

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
    const slice = [];
    for (let i = 0; i < shape.length - 1; i++) {
        slice.push(i + 1);
    }

    const scale = 6;
    const uiSlice = new UiSlice()
        .setScale(scale)
        .setShape(shape) // array of hex strings
        .setSlice(slice); // systems in 1, 2, 3, ... order

    const size = uiSlice.getSize();
    console.log(JSON.stringify(size));

    const widget = uiSlice.createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

miltySlice();
