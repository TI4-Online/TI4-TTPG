const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { MiltyDraftSettingsUI } = require("./milty-draft-settings-ui");
const { MiltyDraftUI } = require("./milty-draft-ui");
const { MiltyFactionGenerator } = require("./milty-faction-generator");
const { MiltySliceGenerator } = require("./milty-slice-generator");
const { MiltySliceLayout } = require("./milty-slice-layout");
const { MiltyUtil } = require("./milty-util");
const { PlayerDeskSetup } = require("../../player-desk/player-desk-setup");
const { SeatTokenUI } = require("./seat-token-ui");
const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { Player, UIElement, world } = require("../../../wrapper/api");

const SELECTION_BORDER_SIZE = 4;

class MiltyDraft {
    constructor() {
        this._sliceDataArray = [];
        this._factionDataArray = [];
        this._seatDataArray = [];
        this._uis = [];
        this._scale = DEFAULT_SLICE_SCALE;

        this._draftSelectionManager = new DraftSelectionManager().setBorderSize(
            SELECTION_BORDER_SIZE * this._scale
        );

        const sliceGenerator = new MiltySliceGenerator();
        const factionGenerator = new MiltyFactionGenerator();
        const callbacks = {
            onFinish: () => {
                console.log("MiltyDraft.Settings.onFinish");
                this.cancel();

                this._sliceDataArray = [];
                this._factionDataArray = [];
                this._seatDataArray = [];

                sliceGenerator.generate().forEach((slice, index) => {
                    console.log(`adding slice [${slice.join(",")}]`);
                    const label = locale("ui.draft.slice_label", {
                        index: index + 1,
                    });
                    this.addSlice(slice, false, label);
                });
                factionGenerator.generate().forEach((faction) => {
                    const nsidName = faction.nsidName;
                    console.log(`adding faction [${nsidName}]`);
                    this.addFaction(faction.nsidName);
                });
                this.setSpeakerIndex(-1); // random
                this.createPlayerUIs();
            },
            onCancel: () => {
                console.log("MiltyDraft.Settings.onCancel");
                this.cancel();
            },
        };
        this._ui = new MiltyDraftSettingsUI(
            sliceGenerator,
            factionGenerator,
            callbacks
        );
    }

    /**
     * UI for showing in the unified phase UI.
     */
    getUI() {
        return this._ui;
    }

    addSlice(slice, color, label) {
        assert(Array.isArray(slice));
        assert(!color || ColorUtil.isColor(color));
        assert(typeof label === "string");

        MiltyUtil.validateSliceOrThrow(slice);

        const sliceData = {
            slice,
            color,
            label,
        };
        const sliceCategoryName = locale("ui.draft.category.slice");
        sliceData.onClickedGenerator =
            this._draftSelectionManager.createOnClickedGenerator(
                sliceCategoryName,
                label,
                sliceData
            );
        this._sliceDataArray.push(sliceData);
        return this;
    }

    addFaction(nsidName) {
        assert(typeof nsidName === "string");

        const faction = world.TI4.getFactionByNsidName(nsidName);
        if (!faction) {
            throw new Error(`unknown faction "${nsidName}"`);
        }

        const factionData = {
            nsidName,
        };
        const factionCategoryName = locale("ui.draft.category.faction");
        factionData.onClickedGenerator =
            this._draftSelectionManager.createOnClickedGenerator(
                factionCategoryName,
                faction.nameFull,
                factionData
            );
        this._factionDataArray.push(factionData);
        return this;
    }

    setSpeakerIndex(speakerIndex) {
        assert(typeof speakerIndex === "number");

        this._seatDataArray = SeatTokenUI.getSeatDataArray(speakerIndex);

        const seatCategoryName = locale("ui.draft.category.seat");
        this._seatDataArray.forEach((seatData) => {
            seatData.onClickedGenerator =
                this._draftSelectionManager.createOnClickedGenerator(
                    seatCategoryName,
                    (seatData.orderIndex + 1).toString(),
                    seatData
                );
        });
        return this;
    }

    _createUI(playerDesk) {
        const pos = playerDesk.center.add([0, 0, 10]);
        const rot = playerDesk.rot;

        const onFinishedButton =
            this._draftSelectionManager.createOnFinishedButton();
        onFinishedButton.onClicked.add((button, player) => {
            this.clearPlayerUIs();
            this.applyChoices();
        });

        const { widget, w, h } = new MiltyDraftUI(this._scale)
            .addSlices(this._sliceDataArray)
            .addFactions(this._factionDataArray)
            .addSeats(this._seatDataArray)
            .getWidgetAndSize(onFinishedButton);
        console.log(`draft ${w}x${h}`);

        const ui = new UIElement();
        ui.width = w;
        ui.height = h;
        ui.useWidgetSize = false;
        ui.position = pos;
        ui.rotation = rot;
        ui.widget = widget;
        ui.scale = 1 / this._scale;

        return ui;
    }

    createPlayerUIs() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            // Hide desk UI (still show "take seat")
            playerDesk.setReady(true);

            const ui = this._createUI(playerDesk);
            this._uis.push(ui);
            world.addUI(ui);
        }
        return this;
    }

    clearPlayerUIs() {
        this._uis.forEach((ui) => {
            world.removeUIElement(ui);
        });
        return this;
    }

    cancel() {
        this.clearPlayerUIs();
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }
    }

    _applyPlayerChoices(chooserSlot, chooserPlayer) {
        assert(typeof chooserSlot === "number");
        assert(!chooserPlayer || chooserPlayer instanceof Player);

        const sliceCategoryName = locale("ui.draft.category.slice");
        const sliceData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            sliceCategoryName
        );
        assert(sliceData);

        const factionCategoryName = locale("ui.draft.category.faction");
        const factionData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            factionCategoryName
        );
        assert(factionData);

        const seatCategoryName = locale("ui.draft.category.seat");
        const seatData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            seatCategoryName
        );
        assert(seatData);

        // Move player to slot.
        const playerDesks = world.TI4.getAllPlayerDesks();
        const playerDesk = playerDesks[seatData.deskIndex];
        assert(playerDesk);
        const playerSlot = playerDesk.playerSlot; // new slot
        if (chooserPlayer) {
            playerDesk.seatPlayer(chooserPlayer);
        }

        // Unpack slice.
        const sliceStr = sliceData.slice.join(" ");
        MiltySliceLayout.doLayout(sliceStr, playerSlot);

        // Unpack faction.
        new PlayerDeskSetup(playerDesk).setupFaction();
    }

    applyChoices() {
        // Position Mecatol and Mallice.
        MapStringLoad.load("{18}", false);

        // Remember player slot to chooser-player.
        const playerSlotToChooserPlayer = {};
        for (const player of world.getAllPlayers()) {
            playerSlotToChooserPlayer[player.getSlot()] = player;
        }

        // Move all players to non-seat slots.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.unseatPlayer();
        }

        // Apply choices.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const player = playerSlotToChooserPlayer[playerSlot];
            this._applyPlayerChoices(playerSlot, player);
        }
        return this;
    }
}

module.exports = { MiltyDraft };
