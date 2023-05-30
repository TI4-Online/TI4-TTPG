const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { UiSlice } = require("./ui-slice");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");

// Visualize hex strings at hex positions.
function addHexLabels() {
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
    const uiSlice = new UiSlice()
        .setShape([
            "<0,0,0>",
            "<1,-1,0>", // left
            "<1,0,-1>", // front
            "<0,1,-1>", // right
            "<2,-1,-1>", // left-eq
            "<2,0,-2>", // front-far
        ])
        .setSlice([1, 2, 3, 4, 5]);

    const size = uiSlice.getSize();
    console.log(JSON.stringify(size));

    const widget = uiSlice.createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / 10;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

miltySlice();
