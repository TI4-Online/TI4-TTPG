const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { MiltySliceGenerator } = require("./milty-slice-generator");
const { MiltySliceLayout } = require("./milty-slice-layout");

/**
 * Milty Draft based on the "abstract slice draft" framework.
 */
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

        const miltyFactionGenerator = new AbstractFactionGenerator(); // no special needs
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

        this.addCustomCheckBox({
            name: "Targeted slice generation",
            default: miltySliceGenerator.getUseTargetedSliceGenerator(),
            onCheckStateChanged: (checkbox, player, isChecked) => {
                miltySliceGenerator.setUseTargetedSliceGenerator(isChecked);
            },
        });
    }
}

module.exports = { MiltySliceDraft };
