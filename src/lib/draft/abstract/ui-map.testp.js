const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { SLICE_SHAPES } = require("./abstract-slice-generator");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { Hyperlane } = require("../../map-string/hyperlane");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { UiMap } = require("./ui-map");

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

function demo() {
    const shape = SLICE_SHAPES.milty;
    const sliceLayout = new AbstractSliceLayout().setShape(shape);

    const params = {
        shape,
        sliceLayout,
        includeHomeSystems: true,
    };
    const { mapString, deskIndexToLabel } = UiMap.geterateMapString(params);

    const scale = 6;
    const widget = new UiMap()
        .setScale(scale)
        .setSpeaker(2)
        .setLabel(1, "my custom label very long")
        .setMapString(mapString)
        .createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

demo();
