const { AbstractFactionGenerator } = require("./abstract-faction-generator");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { AbstractSliceGenerator } = require("./abstract-slice-generator");
const { UiDraftSettings } = require("./ui-draft-settings");
const CONFIG = require("../../../game-ui/game-ui-config");
const { Border, UIElement, refObject } = require("../../../wrapper/api");
const { TableLayout } = require("../../../table/table-layout");

function demo() {
    const sliceGenerator = new AbstractSliceGenerator();
    const factionGenerator = new AbstractFactionGenerator();

    const sliceDraft = new AbstractSliceDraft()
        .setSliceGenerator(sliceGenerator)
        .setFactionGenerator(factionGenerator);

    const widget = new UiDraftSettings(sliceDraft).getWidget();

    const anchor = TableLayout.anchor.gameUI;
    const ui = new UIElement();
    ui.position = [0, 0, 0.26];
    ui.scale = 1 / CONFIG.scale;
    ui.width = anchor.width * CONFIG.scale;
    ui.height = anchor.height * CONFIG.scale;
    ui.useWidgetSize = false;
    ui.widget = new Border().setChild(widget);

    refObject.addUI(ui);
}

demo();
