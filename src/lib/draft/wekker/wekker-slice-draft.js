const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { MiltySliceGenerator } = require("../milty2/milty-slice-generator");
const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");

const WEKKER_SLICE_SHAPE = [
    "<0,0,0>", //home
    "<1,0,-1>",
    "<2,-1,-1>",
    "<3,-1,-2>",
    "<0,1,-1>",
    "<0,2,-2>",
];

class WekkerSliceLayout extends AbstractSliceLayout {
    constructor() {
        super();
        this.setShape(WEKKER_SLICE_SHAPE);
    }
}

class WekkerSliceGenerator extends MiltySliceGenerator {
    constructor() {
        super();
        this.setUseTargetedSliceGenerator(true); // much faster!
    }

    getSliceShape() {
        return WEKKER_SLICE_SHAPE;
    }
}

class WekkerSliceDraft extends AbstractSliceDraft {
    static createDraftSettingsWidget() {
        const sliceDraft = new WekkerSliceDraft();
        return new UiDraftSettings(sliceDraft).getWidget();
    }

    static createDraftNavEntry() {
        return new NavEntry()
            .setName(locale("nav.map.draft.wekker"))
            .setIconPath("global/ui/icons/wekker-hex.png")
            .setPersistWidget(true)
            .setWidgetFactory((navPanel, navEntry) => {
                return WekkerSliceDraft.createDraftSettingsWidget();
            });
    }

    constructor() {
        super();

        const factionGenerator = new AbstractFactionGenerator(); // no special needs
        const sliceLayout = new WekkerSliceLayout();
        const sliceGenerator = new WekkerSliceGenerator();

        this.setFactionGenerator(factionGenerator)
            .setSliceGenerator(sliceGenerator)
            .setSliceLayout(sliceLayout);

        this.addCustomCheckBox({
            name: locale("ui.draft.extra_legendaries_and_wormholes"),
            default: sliceGenerator.getUseExtraWormholesAndLegendaries(),
            onCheckStateChanged: (checkbox, player, isChecked) => {
                sliceGenerator.setUseExtraWormholesAndLegendaries(isChecked);
            },
        });
    }
}

module.exports = { WekkerSliceDraft };
