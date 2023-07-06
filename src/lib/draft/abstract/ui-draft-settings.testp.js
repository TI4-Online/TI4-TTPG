const { AbstractFactionGenerator } = require("./abstract-faction-generator");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { TableLayout } = require("../../../table/table-layout");
const { UiDraftSettings } = require("./ui-draft-settings");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    Border,
    HorizontalBox,
    LayoutBox,
    UIElement,
    refObject,
} = require("../../../wrapper/api");

class DummySliceGeneator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty;
    }
}

function demo() {
    const sliceGenerator = new DummySliceGeneator();
    const sliceLayout = new AbstractSliceLayout().setShape(SLICE_SHAPES.milty);
    const factionGenerator = new AbstractFactionGenerator();

    const sliceDraft = new AbstractSliceDraft()
        .setSliceGenerator(sliceGenerator)
        .setSliceLayout(sliceLayout)
        .setFactionGenerator(factionGenerator);

    sliceDraft.addCustomSlider({
        name: "My Slider",
        min: 0,
        max: 10,
        default: 5,
        onValueChanged: () => {},
    });

    sliceDraft.addCustomCheckBox({
        name: "My CheckBox",
        default: true,
        onCheckStateChanged: () => {},
    });

    const widget = new UiDraftSettings(sliceDraft).getWidget();
    const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
    panel.addChild(widget, 4);
    panel.addChild(new Border().setColor([0, 0, 0, 1]), 1); // used by turn order

    const anchor = TableLayout.anchor.gameUI;
    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / CONFIG.scale;
    ui.width = anchor.width * CONFIG.scale;
    ui.height = anchor.height * CONFIG.scale;
    ui.useWidgetSize = false;
    ui.widget = new Border().setChild(
        new LayoutBox()
            .setChild(panel)
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
    );

    refObject.addUI(ui);
}

demo();
