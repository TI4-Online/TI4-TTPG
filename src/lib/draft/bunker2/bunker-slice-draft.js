const locale = require("../../locale");
const {
    AbstractFactionGenerator,
} = require("../abstract/abstract-faction-generator");
const { AbstractSliceDraft } = require("../abstract/abstract-slice-draft");
const { NavEntry } = require("../../ui/nav/nav-entry");
const { UiDraftSettings } = require("../abstract/ui-draft-settings");
const { BunkerSliceLayout } = require("./bunker-slice-layout");
const { BunkerSliceGenerator } = require("./bunker-slice-generator");
const {
    BunkerFixedSystemsGenerator,
} = require("./bunker-fixed-systems-generator");

class BunkerSliceDraft extends AbstractSliceDraft {
    static createDraftSettingsWidget() {
        const sliceDraft = new BunkerSliceDraft();
        return new UiDraftSettings(sliceDraft).getWidget();
    }

    static createDraftNavEntry() {
        return new NavEntry()
            .setName(locale("nav.map.draft.bunker"))
            .setIconPath("global/ui/icons/bunker-hex.png")
            .setPersistWidget(true)
            .setWidgetFactory((navPanel, navEntry) => {
                return BunkerSliceDraft.createDraftSettingsWidget();
            });
    }

    constructor() {
        super();

        const factionGenerator = new AbstractFactionGenerator(); // no special needs
        const sliceLayout = new BunkerSliceLayout();
        const sliceGenerator = new BunkerSliceGenerator();
        const fixedSystemsGenerator = new BunkerFixedSystemsGenerator();

        this.setFactionGenerator(factionGenerator)
            .setSliceGenerator(sliceGenerator)
            .setSliceLayout(sliceLayout)
            .setFixedSystemsGenerator(fixedSystemsGenerator);
    }
}

module.exports = { BunkerSliceDraft };
