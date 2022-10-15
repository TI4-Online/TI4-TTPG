const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { ColorUtil } = require("../../color/color-util");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { FactionToken } = require("../../faction/faction-token");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { BunkerDraftUI } = require("./bunker-draft-ui");
const { BunkerSliceLayout } = require("./bunker-slice-layout");
const { ObjectNamespace } = require("../../object-namespace");
const { SeatTokenUI } = require("../milty/seat-token-ui");
const { DEFAULT_SLICE_SCALE } = require("./bunker-slice-ui");
const {
    Player,
    Rotator,
    UIElement,
    globalEvents,
    world,
} = require("../../../wrapper/api");

const SELECTION_BORDER_SIZE = 4;

const SPEAKER_TOKEN_POS = { x: 46, y: 0, z: 5 };

class BunkerDraft {
    constructor() {
        this._bunkerDataArray = [];
        this._innerRing = [];
        this._factionDataArray = [];
        this._seatDataArray = [];
        this._uis = [];
        this._updateWaitingFor = [];
        this._scale = DEFAULT_SLICE_SCALE;

        this._draftSelectionManager = new DraftSelectionManager()
            .setBorderSize(SELECTION_BORDER_SIZE * this._scale)
            .setAdvanceTurnOnSelection(true);
    }

    resetBunkers() {
        this._bunkerDataArray = [];
    }

    resetFactions() {
        this._factionDataArray = [];
    }

    addBunker(bunker, color, label) {
        assert(Array.isArray(bunker));
        assert(!color || ColorUtil.isColor(color));
        assert(typeof label === "string");

        const bunkerData = {
            bunker,
            color,
            label,
        };
        const bunkerCategoryName = locale("ui.draft.category.bunker");
        bunkerData.onClickedGenerator =
            this._draftSelectionManager.createOnClickedGenerator(
                bunkerCategoryName,
                label,
                bunkerData
            );
        this._bunkerDataArray.push(bunkerData);
        return this;
    }

    setInnerRing(innerRing) {
        assert(Array.isArray(innerRing));
        assert(innerRing.length === 6);

        this._innerRing = innerRing;
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

        const { widget, w, h, updateWaitingFor } = new BunkerDraftUI(
            playerDesk,
            this._scale
        )
            .addBunkers(this._bunkerDataArray)
            .addInnerRing(this._innerRing, this._seatDataArray)
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

        const bunkerCategoryName = locale("ui.draft.category.bunker");
        const bunkerData = this._draftSelectionManager.getSelectionData(
            chooserSlot,
            bunkerCategoryName
        );
        assert(bunkerData);

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

        // Unpack bunker.
        BunkerSliceLayout.doLayoutBunker(bunkerData.bunker, playerSlot);

        // Unpack faction?  No, just place the token and let players click the
        // unpack button.  This is also a pause for Keleres to change flavors.
        // Old way: "new PlayerDeskSetup(playerDesk).setupFactionAsync(factionData.nsidName);"
        console.log(
            `BunkerDraft._applyPlayerChoices: ${playerDesk.colorName} faction ${factionData.nsidName}`
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
            `BunkerDraft._applyPlayerChoices: NO FACTION REFERENCE`;
        }

        playerDesk.setReady(false);
        playerDesk.resetUI();
    }

    applyChoices(clickingPlayer) {
        assert(clickingPlayer instanceof Player);

        // Position Mecatol and Mallice.
        MapStringLoad.load("{18}", true);

        // Unpack inner ring.
        BunkerSliceLayout.doLayoutInnerRing(this._innerRing);

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

        // Hyperlanes
        const playerCount = world.TI4.config.playerCount;
        const hyperlanesString = BunkerSliceLayout._addHyperlanes(
            "",
            playerCount
        );
        console.log(`BunkerDraft: hyperlanes "${hyperlanesString}"`);
        MapStringLoad.load(hyperlanesString, true);

        // Set turn order.
        const playerDesks = world.TI4.getAllPlayerDesks();
        let order = [];
        for (let i = 0; i < playerCount; i++) {
            const nextIdx = (this._speakerIndex + i) % playerCount;
            const nextDesk = playerDesks[nextIdx];
            assert(nextDesk);
            order.push(nextDesk);
        }
        if (order.length > 0) {
            world.TI4.turns.setTurnOrder(order, clickingPlayer);
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

module.exports = { BunkerDraft };
