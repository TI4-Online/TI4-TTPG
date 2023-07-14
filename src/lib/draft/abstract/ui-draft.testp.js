const { AbstractSliceDraft } = require("./abstract-slice-draft");
const {
    SLICE_SHAPES,
    AbstractSliceGenerator,
} = require("./abstract-slice-generator");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { UiDraft } = require("./ui-draft");
const { Border, UIElement, refObject, world } = require("../../../wrapper/api");

class DummySliceGeneator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty;
    }
    generateSlices() {
        return [
            [21, 22, 23, 24, 25],
            [31, 32, 33, 34, 35],
            [41, 42, 43, 44, 45],
            [26, 27, 28, 29, 30],
            [61, 62, 63, 64, 65],
            [71, 72, 73, 74, 75],
            [81, 82, 83, 84, 85],
        ];
    }
}

function demo() {
    const clickingPlayer = undefined;
    const sliceLayout = new AbstractSliceLayout().setShape(SLICE_SHAPES.milty);
    const sliceDraft = new AbstractSliceDraft()
        .setSliceGenerator(new DummySliceGeneator())
        .setSliceLayout(sliceLayout)
        .randomizeSpeakerIndex()
        .start(clickingPlayer);

    // Make some selections (before creating UI).
    const playerCount = world.TI4.config.playerCount;
    const slices = sliceDraft.getSlices();
    const factions = sliceDraft.getFactionNsidNames();
    for (let chooser = 0; chooser < playerCount; chooser++) {
        const slice = slices[chooser];
        const faction = factions[chooser];
        const seatIndex = chooser;
        sliceDraft.setChooserSlice(chooser, slice);
        sliceDraft.setChooserFaction(chooser, faction);
        sliceDraft.setChooserSeatIndex(chooser, seatIndex);
    }

    const scale = 8; // 6 is enough, 10 is better
    const uiDraft = new UiDraft(sliceDraft).setScale(scale);

    const widget = uiDraft.createWidget();

    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / scale;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

demo();
