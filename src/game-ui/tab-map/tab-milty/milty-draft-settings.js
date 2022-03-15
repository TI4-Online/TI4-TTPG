const locale = require("../../../lib/locale");
const { Broadcast } = require("../../../lib/broadcast");
const { MiltyDraft } = require("../../../lib/draft/milty/milty-draft");
const { MiltyDraftSettingsUI } = require("./milty-draft-settings-ui");
const {
    MiltyFactionGenerator,
} = require("../../../lib/draft/milty/milty-faction-generator");
const {
    MiltySliceGenerator,
} = require("../../../lib/draft/milty/milty-slice-generator");
const { MiltyUtil } = require("../../../lib/draft/milty/milty-util");
const { world } = require("../../../wrapper/api");

class MiltyDraftSettings {
    constructor() {
        const sliceGenerator = new MiltySliceGenerator();
        const factionGenerator = new MiltyFactionGenerator();
        const miltyDraft = new MiltyDraft();
        const callbacks = {
            onFinish: (customConfig) => {
                console.log("MiltyDraft.Settings.onFinish");
                miltyDraft.cancel();

                sliceGenerator.generate().forEach((slice, index) => {
                    console.log(`adding slice [${slice.join(",")}]`);
                    const label = locale("ui.draft.slice_label", {
                        index: index + 1,
                    });
                    miltyDraft.addSlice(slice, false, label);
                });
                factionGenerator.generate().forEach((faction) => {
                    const nsidName = faction.nsidName;
                    console.log(`adding faction [${nsidName}]`);
                    miltyDraft.addFaction(faction.nsidName);
                });
                miltyDraft.setSpeakerIndex(-1); // random

                // If custom config set slices, labels, or factions use those instead.
                const custom = MiltyUtil.parseCustomConfig(customConfig);
                if (custom) {
                    const error = MiltyUtil.getCustomConfigError(custom);
                    if (error) {
                        Broadcast.chatAll(error);
                        return false;
                    }
                    if (custom.slices.length < world.TI4.config.playerCount) {
                        Broadcast.chatAll("not enough slices for player count");
                        return false;
                    }
                    miltyDraft.resetSlices();
                    for (let i = 0; i < custom.slices.length; i++) {
                        const slice = custom.slices[i];
                        const label = custom.labels[i];
                        miltyDraft.addSlice(slice, false, label);
                    }
                }

                miltyDraft.createPlayerUIs();
                return true;
            },
            onCancel: () => {
                console.log("MiltyDraft.Settings.onCancel");
                miltyDraft.cancel();
            },
        };
        this._ui = new MiltyDraftSettingsUI(
            sliceGenerator,
            factionGenerator,
            callbacks
        );
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { MiltyDraftSettings };
