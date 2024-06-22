const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
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

        const factionGenerator = new AbstractFactionGenerator(); // no special needs
        const sliceLayout = new MiltyEqSliceLayout();
        const sliceGenerator = new MiltyEqSliceGenerator();
        const fixedSystemsGenerator = new MiltyEqFixedSystemsGenerator();

        this.setFactionGenerator(factionGenerator)
            .setSliceGenerator(sliceGenerator)
            .setSliceLayout(sliceLayout)
            .setFixedSystemsGenerator(fixedSystemsGenerator);

        this.addCustomCheckBox({
            name: "Leave equidistants empty",
            default: false,
            onCheckStateChanged: (checkbox, player, isChecked) => {
                console.log(
                    `MiltyEqSliceDraft: leave equidistants empty: ${isChecked}`
                );
                if (isChecked) {
                    this.setFixedSystemsGenerator(undefined);
                } else {
                    this.setFixedSystemsGenerator(fixedSystemsGenerator);
                }
            },
        });
    }
}

module.exports = { MiltyEqSliceDraft };
