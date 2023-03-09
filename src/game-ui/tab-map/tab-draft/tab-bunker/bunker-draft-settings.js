const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { Broadcast } = require("../../../../lib/broadcast");
const { BunkerDraft } = require("../../../../lib/draft/bunker/bunker-draft");
const { BunkerDraftSettingsUI } = require("./bunker-draft-settings-ui");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const {
    BunkerSliceGenerator,
} = require("../../../../lib/draft/bunker/bunker-slice-generator");
const { Player, world } = require("../../../../wrapper/api");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");
const { BunkerUtil } = require("../../../../lib/draft/bunker/bunker-util");

class BunkerDraftSettings {
    constructor() {
        this._sliceGenerator = new BunkerSliceGenerator();
        this._factionGenerator = new MiltyFactionGenerator();
        this._bunkerDraft = undefined;
        this._bunkerOffset = false;
        const callbacks = {
            onFinish: (customConfig, player) => {
                assert(player instanceof Player);
                console.log("BunkerDraftSettings.onFinish");
                if (this._bunkerDraft) {
                    this._bunkerDraft.cancel();
                    this._bunkerDraft = undefined;
                }

                this._bunkerDraft = new BunkerDraft().setBunkerOffset(
                    this._bunkerOffset
                );

                // UI may have adjusted any settings (e.g. bunker count).
                const bunkersAndInner = this._sliceGenerator.simpleGenerate();

                bunkersAndInner.bunkers.forEach((bunker, index) => {
                    console.log(`adding bunker [${bunker.join(",")}]`);
                    const label = locale("ui.draft.bunker_label", {
                        index: index + 1,
                    });
                    const color = false;
                    this._bunkerDraft.addBunker(bunker, color, label);
                });
                this._bunkerDraft.setInnerRing(bunkersAndInner.innerRing);

                this._factionGenerator.generate().forEach((faction) => {
                    const nsidName = faction.nsidName;
                    console.log(`adding faction [${nsidName}]`);
                    this._bunkerDraft.addFaction(faction.nsidName);
                });
                this._bunkerDraft.setSpeakerIndex(-1); // random

                // If custom config set slices, labels, or factions use those instead.
                const custom = BunkerUtil.parseCustomConfig(customConfig);
                if (custom) {
                    const error = BunkerUtil.getCustomConfigError(custom);
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
                        this._bunkerDraft.resetBunkers();
                        for (let i = 0; i < custom.slices.length; i++) {
                            const slice = custom.slices[i];
                            let label = "x";
                            if (custom.labels && custom.labels[i]) {
                                label = custom.labels[i];
                            } else {
                                label = locale("ui.draft.bunker_label", {
                                    index: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i],
                                });
                            }
                            this._bunkerDraft.addBunker(slice, false, label);
                        }
                    }
                    if (custom.factions) {
                        this._bunkerDraft.resetFactions();
                        for (const factionNsidName of custom.factions) {
                            this._bunkerDraft.addFaction(factionNsidName);
                        }
                    }
                }

                const playerDesks = world.TI4.getAllPlayerDesks();
                world.TI4.turns.randomizeTurnOrder(
                    playerDesks,
                    player,
                    TURN_ORDER_TYPE.SNAKE
                );

                this._bunkerDraft.createPlayerUIs();
                return true;
            },
            onCancel: (player) => {
                assert(player instanceof Player);
                console.log("BunkerDraftSettings.onCancel");
                if (this._bunkerDraft) {
                    this._bunkerDraft.cancel();
                }
                this._bunkerDraft = undefined;
                this._sliceGenerator.reset();
            },
            setBunkerOffset: (value) => {
                this._bunkerOffset = value;
            },
        };
        this._ui = new BunkerDraftSettingsUI(
            this._sliceGenerator,
            this._factionGenerator,
            callbacks
        );
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { BunkerDraftSettings };
