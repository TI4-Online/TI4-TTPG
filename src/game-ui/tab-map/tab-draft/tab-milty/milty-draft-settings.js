const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { Broadcast } = require("../../../../lib/broadcast");
const { MiltyDraft } = require("../../../../lib/draft/milty/milty-draft");
const { MiltyDraftSettingsUI } = require("./milty-draft-settings-ui");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const {
    MiltySliceGenerator,
} = require("../../../../lib/draft/milty/milty-slice-generator");
const { MiltyUtil } = require("../../../../lib/draft/milty/milty-util");
const { Player, world } = require("../../../../wrapper/api");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");

class MiltyDraftSettings {
    constructor() {
        const sliceGenerator = new MiltySliceGenerator();
        const factionGenerator = new MiltyFactionGenerator();
        this._miltyDraft = undefined;
        const callbacks = {
            onFinish: (customConfig, player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onFinish");
                if (this._miltyDraft) {
                    this._miltyDraft.cancel();
                    this._miltyDraft = undefined;
                }

                this._miltyDraft = new MiltyDraft();

                sliceGenerator.generate().forEach((slice, index) => {
                    console.log(`adding slice [${slice.join(",")}]`);
                    const label = locale("ui.draft.slice_label", {
                        index: index + 1,
                    });
                    this._miltyDraft.addSlice(slice, false, label);
                });
                factionGenerator.generate().forEach((faction) => {
                    const nsidName = faction.nsidName;
                    console.log(`adding faction [${nsidName}]`);
                    this._miltyDraft.addFaction(faction.nsidName);
                });
                this._miltyDraft.setSpeakerIndex(-1); // random

                // If custom config set slices, labels, or factions use those instead.
                const custom = MiltyUtil.parseCustomConfig(customConfig);
                if (custom) {
                    const error = MiltyUtil.getCustomConfigError(custom);
                    if (error) {
                        Broadcast.chatAll(error);
                        return false;
                    }
                    if (custom.slices) {
                        if (
                            custom.slices.length < world.TI4.config.playerCount
                        ) {
                            Broadcast.chatAll(
                                "not enough slices for player count"
                            );
                            return false;
                        }
                        this._miltyDraft.resetSlices();
                        for (let i = 0; i < custom.slices.length; i++) {
                            const slice = custom.slices[i];
                            let label = "x";
                            if (custom.labels && custom.labels[i]) {
                                label = custom.labels[i];
                            } else {
                                label = locale("ui.draft.slice_label", {
                                    index: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i],
                                });
                            }
                            this._miltyDraft.addSlice(slice, false, label);
                        }
                    }
                    if (custom.factions) {
                        this._miltyDraft.resetFactions();
                        for (const factionNsidName of custom.factions) {
                            this._miltyDraft.addFaction(factionNsidName);
                        }
                    }
                }

                const playerDesks = world.TI4.getAllPlayerDesks();
                world.TI4.turns.randomizeTurnOrder(
                    playerDesks,
                    player,
                    TURN_ORDER_TYPE.SNAKE
                );

                this._miltyDraft.createPlayerUIs();
                return true;
            },
            onCancel: (player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onCancel");
                if (this._miltyDraft) {
                    this._miltyDraft.cancel();
                }
                this._miltyDraft = undefined;
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
