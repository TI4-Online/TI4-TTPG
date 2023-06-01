const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { UiSlice } = require("./ui-slice");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");

const ADD_HEX_LABELS = false;

const SLICE_SHAPES = {
    bunker: [
        "<0,1,-1>", // right
        "<0,0,0>", // anchor
        "<1,0,-1>", // front
        "<1,1,-2>", // right-eq
        "<0,2,-2>", // right-far
    ],
    bunker_right: [
        "<0,2,-2>", // right-far
        "<0,0,0>", // anchor
        "<1,0,-1>", // front
        "<1,1,-2>", // right-eq
        "<0,1,-1>", // right
    ],
    milty: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ],
    milty_eq: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,0,-2>", // front-far
    ],
};

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

    const uiSlice = new UiSlice()
        .setShape(shape) // array of hex strings
        .setSlice(slice); // systems in 1, 2, 3, ... order

    const size = uiSlice.getSize();
    console.log(JSON.stringify(size));

    const widget = uiSlice.createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 0.1;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

miltySlice();
