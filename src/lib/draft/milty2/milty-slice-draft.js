const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const {
    SLICE_SHAPES,
    AbstractSliceGenerator,
} = require("../abstract/abstract-slice-generator");
const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { miltyslices } = require("./milty-draft-dot-com");
const { world } = require("../../../wrapper/api");
const { NavEntry } = require("../../ui/nav/nav-entry");

/**
 * Milty Draft based on the "abstract slice draft" framework.
 */

/**
 * Set slice shape, with adjustments for 7 or 8 player games.
 */
class MiltySliceLayout extends AbstractSliceLayout {
    constructor() {
        super();

        this.setShape(SLICE_SHAPES.milty);

        if (world.TI4.config.playerCount === 7) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_7p_seatIndex3);
        } else if (world.TI4.config.playerCount === 8) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_7p_seatIndex3);
            this.setOverrideShape(7, SLICE_SHAPES.milty_7p_seatIndex3);
        }
    }
}

/**
 * Use the default faction generator.
 */
class MiltyFactionGenerator extends AbstractFactionGenerator {}

class MiltySliceGenerator extends AbstractSliceGenerator {
    constructor() {
        super();
        this._useExtraWormholesAndLegendaries = true;
    }

    getUseExtraWormholesAndLegendaries() {
        return this._useExtraWormholesAndLegendaries;
    }

    setUseExtraWormholesAndLegendaries(value) {
        assert(typeof value === "boolean");
        this._useExtraWormholesAndLegendaries = value;
        return this;
    }

    getSliceShape() {
        return SLICE_SHAPES.milty;
    }

    generateSlices(sliceCount) {
        while (sliceCount > 0) {
            const numSlices = this.getCount();
            const extralegwh = this.getUseExtraWormholesAndLegendaries();
            const slices = miltyslices(numSlices, extralegwh);
            if (slices) {
                return slices;
            }
        }
    }
}

class MiltySliceDraft extends AbstractSliceDraft {
    static createDraftSettingsWidget() {
        const sliceDraft = new MiltySliceDraft();
        return new UiDraftSettings(sliceDraft).getWidget();
    }

    static createDraftNavEntry() {
        return new NavEntry()
            .setName(locale("nav.map.draft.milty"))
            .setIconPath("global/ui/icons/milty-hex.png")
            .setPersistWidget(true)
            .setWidgetFactory((navPanel, navEntry) => {
                return MiltySliceDraft.createDraftSettingsWidget();
            });
    }

    constructor() {
        super();

        const miltyFactionGenerator = new MiltyFactionGenerator();
        const miltySliceLayout = new MiltySliceLayout();
        const miltySliceGenerator = new MiltySliceGenerator();

        this.setFactionGenerator(miltyFactionGenerator)
            .setSliceGenerator(miltySliceGenerator)
            .setSliceLayout(miltySliceLayout);

        this.addCustomCheckBox({
            name: locale("ui.draft.extra_legendaries_and_wormholes"),
            default: miltySliceGenerator.getUseExtraWormholesAndLegendaries(),
            onCheckStateChanged: (checkbox, player, isChecked) => {
                miltySliceGenerator.setUseExtraWormholesAndLegendaries(
                    isChecked
                );
            },
        });
    }
}

module.exports = { MiltySliceDraft };
