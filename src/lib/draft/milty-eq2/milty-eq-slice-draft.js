const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { MiltyEqSliceGenerator } = require("./milty-eq-slice-generator");

const { MiltyEqSliceLayout } = require("./milty-eq-slice-layout");
const {
    MiltyEqFixedSystemsGenerator,
} = require("./milty-eq-fixed-systems-generator");

class MiltyEqSliceDraft extends AbstractSliceDraft {
    static createDraftSettingsWidget() {
        const sliceDraft = new MiltyEqSliceDraft();
        return new UiDraftSettings(sliceDraft).getWidget();
    }

    static createDraftNavEntry() {
        return new NavEntry()
            .setName(locale("nav.map.draft.milty_eq"))
            .setIconPath("global/ui/icons/milty-eq-hex.png")
            .setPersistWidget(true)
            .setWidgetFactory((navPanel, navEntry) => {
                return MiltyEqSliceDraft.createDraftSettingsWidget();
            });
    }

    constructor() {
        super();

        const miltyEqFactionGenerator = new AbstractFactionGenerator(); // no special needs
        const miltyEqSliceLayout = new MiltyEqSliceLayout();
        const miltyEqSliceGenerator = new MiltyEqSliceGenerator();
        const miltyEqFixedSystemsGenerator = new MiltyEqFixedSystemsGenerator();

        this.setFactionGenerator(miltyEqFactionGenerator)
            .setSliceGenerator(miltyEqSliceGenerator)
            .setSliceLayout(miltyEqSliceLayout)
            .setFixedSystemsGenerator(miltyEqFixedSystemsGenerator);
    }
}

module.exports = { MiltyEqSliceDraft };
