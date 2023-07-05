const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const {
    SLICE_SHAPES,
    AbstractSliceGenerator,
} = require("./abstract-slice-generator");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { Hyperlane } = require("../../map-string/hyperlane");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { UiMap } = require("./ui-map");
const { AbstractSliceDraft } = require("./abstract-slice-draft");

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

class DummySliceGeneator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty;
    }
}

function demo() {
    const sliceLayout = new AbstractSliceLayout().setShape(SLICE_SHAPES.milty);

    const sliceDraft = new AbstractSliceDraft()
        .setSliceGenerator(new DummySliceGeneator())
        .setSliceLayout(sliceLayout)
        .setChooserFaction(0, "arborec")
        .setChooserSeatIndex(0, 1)
        .setChooserSeatIndex(1, 5)
        .setChooserSlice(1, [21, 22, 23, 24, 25]);

    const includeHomeSystems = true;
    const { mapString, deskIndexToLabel } = UiMap.generateMapString(
        sliceDraft,
        includeHomeSystems
    );

    const scale = 6;
    const uiMap = new UiMap()
        .setScale(scale)
        .setSpeaker(2)
        .setLabel(1, "my custom label very long")
        .setMapString(mapString);

    const widget = uiMap.createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

demo();
