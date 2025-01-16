const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { MiltySliceGenerator } = require("../milty2/milty-slice-generator");
const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");
const { world } = require("../../../wrapper/api");

// Supoosed to be: Right Neighbor, Right Home, Mid Home, Equidistant, Left Mecatol Rex
// TTPG loads it as: Left Mecatol Rex, Equidistant, Mid Home, Right Home, Right Neighbor

const WEKKER_SLICE_SHAPE = [
    "<0,0,0>", //home
    "<0,2,-2>", // right-right [0]
    "<0,1,-1>", // right [1]
    "<1,0,-1>", // front [2]
    "<2,-1,-1>", // left-eq [3]
    "<3,-1,-2>", // left-far [4]
];

const HYPERLANE_MERGE_R = [
    "<0,0,0>", //home
    "<0,2,-2>", // right-right
    "<0,1,-1>", // right
    "<1,0,-1>", // front
    "<3,-3,0>",
    "<4,-1,-3>",
];

const HYPERLANE_MERGE_L = [
    "<0,0,0>", //home
    "<2,3,-5>",
    "<0,1,-1>", // right
    "<1,0,-1>", // front
    "<2,-1,-1>", // left-eq
    "<3,-1,-2>", // left-far
];

class WekkerSliceLayout extends AbstractSliceLayout {
    constructor() {
        super();
        this.setShape(WEKKER_SLICE_SHAPE);

        if (world.TI4.config.playerCount === 5) {
            this.setOverrideShape(0, HYPERLANE_MERGE_R);
            this.setOverrideShape(1, HYPERLANE_MERGE_L);
        }

        if (world.TI4.config.playerCount === 4) {
            this.setOverrideShape(0, HYPERLANE_MERGE_R);
            this.setOverrideShape(1, HYPERLANE_MERGE_L);
            this.setOverrideShape(2, HYPERLANE_MERGE_R);
            this.setOverrideShape(3, HYPERLANE_MERGE_L);
        }
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

        this.setMinPlayerCount(4);
        this.setMaxPlayerCount(6);

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
