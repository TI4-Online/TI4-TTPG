const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { Broadcast } = require("../../../../lib/broadcast");
const {
    MiltyEqDraft,
} = require("../../../../lib/draft/milty-eq/milty-eq-draft");
const { MiltyEqDraftSettingsUI } = require("./milty-eq-draft-settings-ui");
const {
    MiltyEqSliceGenerator,
} = require("../../../../lib/draft/milty-eq/milty-eq-slice-generator");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const { Player, world } = require("../../../../wrapper/api");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");
const { BunkerUtil } = require("../../../../lib/draft/bunker/bunker-util");

class MiltyEqDraftSettings {
    constructor() {
        const miltyEqSliceGenerator = new MiltyEqSliceGenerator();
        const factionGenerator = new MiltyFactionGenerator();
        this._miltyEqDraft = undefined;
        this.factionSelected = [];
        const callbacks = {
            onFinish: (customConfig, player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onFinish");
                if (this._miltyEqDraft) {
                    this._miltyEqDraft.cancel();
                    this._miltyEqDraft = undefined;
                }

                this._miltyEqDraft = new MiltyEqDraft();

                const generated = miltyEqSliceGenerator.simpleGenerate();
                assert(Array.isArray(generated.eqs));
                assert(Array.isArray(generated.slices));

                this._miltyEqDraft.setEqTiles(generated.eqs);
                generated.slices.forEach((slice, index) => {
                    console.log(`adding slice [${slice.join(",")}]`);
                    const label = locale("ui.draft.slice_label", {
                        index: index + 1,
                    });
                    this._miltyEqDraft.addSlice(slice, false, label);
                });
                factionGenerator.generate().forEach((faction) => {
                    const nsidName = faction.nsidName;
                    console.log(`adding faction [${nsidName}]`);
                    this._miltyEqDraft.addFaction(faction.nsidName);
                });
                this._miltyEqDraft.setSpeakerIndex(-1); // random

                // If custom config set slices, labels, or factions use those instead.
                const custom = BunkerUtil.parseCustomConfig(customConfig);
                if (custom) {
                    const error = BunkerUtil.getCustomConfigError(custom);
                    if (error) {
                        Broadcast.chatAll(error);
                        return false;
                    }
                    if (custom.slices) {
                        const innerRing = custom.inner;
                        if (!innerRing) {
                            Broadcast.chatAll(
                                "missing &eq= tiles (or mismatched to player count)",
                                Broadcast.ERROR
                            );
                            return false;
                        }
                        if (
                            custom.slices.length < world.TI4.config.playerCount
                        ) {
                            Broadcast.chatAll(
                                "not enough slices for player count",
                                Broadcast.ERROR
                            );
                            return false;
                        }
                        this._miltyEqDraft.resetSlices();
                        this._miltyEqDraft.setEqTiles(innerRing);
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
                            this._miltyEqDraft.addSlice(slice, false, label);
                        }
                    }
                    if (custom.factions) {
                        this._miltyEqDraft.resetFactions();
                        for (const factionNsidName of custom.factions) {
                            this._miltyEqDraft.addFaction(factionNsidName);
                        }
                    }
                }

                const playerDesks = world.TI4.getAllPlayerDesks();
                world.TI4.turns.randomizeTurnOrder(
                    playerDesks,
                    player,
                    TURN_ORDER_TYPE.SNAKE
                );

                this._miltyEqDraft.createPlayerUIs();
                return true;
            },
            onCancel: (player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onCancel");
                if (this._miltyEqDraft) {
                    this._miltyEqDraft.cancel();
                }
                this._miltyEqDraft = undefined;
                miltyEqSliceGenerator.reset();
            },
            onCustom: (player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onCustom");
                return true;
            },
            onClear: (player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onClear");
                this.factionSelected = [];
            },
            onFaction: (factionNSID, sliceInput, player) => {
                assert(player instanceof Player);
                console.log("MiltyDraft.Settings.onFaction");
                if (this.factionSelected.includes(factionNSID)) {
                    if (this.factionSelected.indexOf(factionNSID) !== -1) {
                        this.factionSelected.splice(
                            this.factionSelected.indexOf(factionNSID),
                            1
                        );
                    }
                } else {
                    this.factionSelected.push(factionNSID);
                }
                return {
                    customInputString: sliceInput,
                    factions: this.factionSelected,
                };
            },
        };
        this._ui = new MiltyEqDraftSettingsUI(
            miltyEqSliceGenerator,
            factionGenerator,
            callbacks
        );
    }

    getUI() {
        return this._ui.getWidget();
    }
}

module.exports = { MiltyEqDraftSettings };
