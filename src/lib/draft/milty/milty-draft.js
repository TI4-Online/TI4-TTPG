const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { Broadcast } = require("../../broadcast");
const { ColorUtil } = require("../../color/color-util");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { FactionToken } = require("../../faction/faction-token");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { MapStringSave } = require("../../map-string/map-string-save");
const { MiltyDraftUI } = require("./milty-draft-ui");
const { MiltySliceLayout } = require("./milty-slice-layout");
const { MiltyUtil } = require("./milty-util");
const { ObjectNamespace } = require("../../object-namespace");
const { SeatTokenUI } = require("./seat-token-ui");
const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const {
    Player,
    Rotator,
    UIElement,
    globalEvents,
    world,
} = require("../../../wrapper/api");

const SELECTION_BORDER_SIZE = 4;

const SPEAKER_TOKEN_POS = { x: 46, y: 0, z: 5 };

class MiltyDraft {
    constructor() {
        this._sliceDataArray = [];
        this._factionDataArray = [];
        this._seatDataArray = [];
        this._uis = [];
        this._updateWaitingFor = [];
        this._scale = DEFAULT_SLICE_SCALE;

        this._draftSelectionManager = new DraftSelectionManager()
            .setBorderSize(SELECTION_BORDER_SIZE * this._scale)
            .setAdvanceTurnOnSelection(true);
    }

    resetSlices() {
        this._sliceDataArray = [];
    }

    resetFactions() {
        this._factionDataArray = [];
    }

    addSlice(slice, color, label) {
        assert(Array.isArray(slice));
        assert(!color || ColorUtil.isColor(color));
        assert(typeof label === "string");

        const error = MiltyUtil.getSliceError(slice);
        if (error) {
            Broadcast.chatAll(error);
            return;
        }

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

        const playerCount = world.TI4.config.playerCount;
        if (speakerIndex === -1) {
            speakerIndex = Math.floor(Math.random() * playerCount);
        }

        this._speakerIndex = speakerIndex;
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
            this.applyChoices(player);
        });

        const { widget, w, h, updateWaitingFor } = new MiltyDraftUI(this._scale)
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

        this._updateWaitingFor.push(updateWaitingFor);

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
        this._updateWaitingFor.forEach((handler) => {
            globalEvents.TI4.onTurnOrderChanged.add(handler);
            globalEvents.TI4.onTurnChanged.add(handler);
        });
        return this;
    }

    clearPlayerUIs() {
        this._uis.forEach((ui) => {
            world.removeUIElement(ui);
        });
        this._updateWaitingFor.forEach((handler) => {
            globalEvents.TI4.onTurnOrderChanged.remove(handler);
            globalEvents.TI4.onTurnChanged.remove(handler);
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

        // Unpack faction?  No, just place the token and let players click the
        // unpack button.  This is also a pause for Keleres to change flavors.
        // Old way: "new PlayerDeskSetup(playerDesk).setupFactionAsync(factionData.nsidName);"
        console.log(
            `MiltyDraft._applyPlayerChoices: ${playerDesk.colorName} faction ${factionData.nsidName}`
        );
        const factionReference = FactionToken.findOrSpawnFactionReference(
            factionData.nsidName
        );
        if (factionReference) {
            factionReference.setPosition(playerDesk.center.add([0, 0, 10]));
            factionReference.setRotation(
                new Rotator(0, 0, 180).compose(playerDesk.rot)
            );
        } else {
            `MiltyDraft._applyPlayerChoices: NO FACTION REFERENCE`;
        }

        playerDesk.setReady(false);
        playerDesk.resetUI();
    }

    applyChoices(player) {
        assert(player instanceof Player);

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

        // Apply hyperlanes.
        const mapStringBefore = MapStringSave.save();
        const mapStringAfter = MiltySliceLayout._addHyperlanes(mapStringBefore);
        if (mapStringAfter !== mapStringBefore) {
            console.log(
                `MiltyDraft.applyChoices: adding hyperlanes:\n${mapStringBefore}\n${mapStringAfter}`
            );
            for (const obj of world.getAllObjects()) {
                if (obj.getContainer()) {
                    continue;
                }
                if (!ObjectNamespace.isSystemTile(obj)) {
                    continue;
                }
                const tile = ObjectNamespace.parseSystemTile(obj).tile;
                if (tile <= 0) {
                    continue;
                }
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
            MapStringLoad.load(mapStringAfter);
        }

        // Set turn order.
        const playerCount = world.TI4.config.playerCount;
        const playerDesks = world.TI4.getAllPlayerDesks();
        let order = [];
        for (let i = 0; i < playerCount; i++) {
            const nextIdx = (this._speakerIndex + i) % playerCount;
            const nextDesk = playerDesks[nextIdx];
            assert(nextDesk);
            order.push(nextDesk);
        }
        if (order.length > 0) {
            world.TI4.turns.setTurnOrder(order, player);
        }

        // Move speaker token.
        const speakerDesk = order.length > 0 ? order[0] : false;
        const speakerTokenNsid = "token:base/speaker";
        let speakerToken = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === speakerTokenNsid) {
                speakerToken = obj;
                break;
            }
        }
        if (speakerDesk && speakerToken) {
            const pos = speakerDesk.localPositionToWorld(SPEAKER_TOKEN_POS);
            const rot = speakerDesk.rot;
            speakerToken.setPosition(pos);
            speakerToken.setRotation(rot);
        }

        return this;
    }
}

module.exports = { MiltyDraft };
