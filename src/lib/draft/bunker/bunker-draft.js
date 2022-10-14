const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { Broadcast } = require("../../broadcast");
const { ColorUtil } = require("../../color/color-util");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { FactionToken } = require("../../faction/faction-token");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { MapStringSave } = require("../../map-string/map-string-save");
const { BunkerDraftUI } = require("./bunker-draft-ui");
const { BunkerSliceLayout } = require("./bunker-slice-layout");
const { ObjectNamespace } = require("../../object-namespace");
const { SeatTokenUI } = require("../milty/seat-token-ui");
const { DEFAULT_SLICE_SCALE } = require("./bunker-slice-ui");
const { UIElement, globalEvents, world } = require("../../../wrapper/api");

const SELECTION_BORDER_SIZE = 4;

const SPEAKER_TOKEN_POS = { x: 46, y: 0, z: 5 };

class BunkerDraft {
    constructor() {
        this._bunkerDataArray = [];
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

    applyChoices(clickingPlayer) {
        // TODO XXX
    }
}

module.exports = { BunkerDraft };
