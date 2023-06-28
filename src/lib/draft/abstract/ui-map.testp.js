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

    const abstractSliceLayout = new AbstractSliceLayout().setShape(shape);
    for (
        let deskIndex = 0;
        deskIndex < world.TI4.config.playerCount;
        deskIndex++
    ) {
        const home = UiMap.deskIndexToColorTile(deskIndex, true);
        abstractSliceLayout.setAnchorTile(deskIndex, home);

        const tile = UiMap.deskIndexToColorTile(deskIndex, false);
        const slice = [tile, tile, tile, tile, tile];
        abstractSliceLayout.setSlice(deskIndex, slice);
    }
    const slicesMapString = abstractSliceLayout.generateMapString();
    const hyperlanesMapString = Hyperlane.getMapString(
        world.TI4.config.playerCount
    );
    let mapString;
    if (hyperlanesMapString) {
        mapString = new AbstractPlaceHyperlanes().placeHyperlanes(
            slicesMapString,
            hyperlanesMapString
        );
    } else {
        mapString = slicesMapString;
    }

    const scale = 6;
    const widget = new UiMap()
        .setScale(scale)
        .setSpeaker(2)
        .setMapString(mapString)
        .createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

demo();
