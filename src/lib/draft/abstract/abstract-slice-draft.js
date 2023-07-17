const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const TriggerableMulticastDelegate = require("../../triggerable-multicast-delegate");
const { AbstractFactionGenerator } = require("./abstract-faction-generator");
const {
    AbstractFixedSystemsGenerator,
} = require("./abstract-fixed-systems-generator");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { AbstractSliceGenerator } = require("./abstract-slice-generator");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { TURN_ORDER_TYPE } = require("../../turns");
const { AbstractUtil } = require("./abstract-util");
const { Broadcast } = require("../../broadcast");
const { FactionToken } = require("../../faction/faction-token");
const { MapStringLoad } = require("../../map-string/map-string-load");
const { PlayerDesk } = require("../../player-desk/player-desk");
const { Shuffle } = require("../../shuffle");
const { UiMap } = require("./ui-map");
const { Player, Rotator, world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");

const SPEAKER_TOKEN_POS = { x: 48, y: 0, z: 5 };

/**
 * Overall draft controller.  Draws draft UI, manages draft, executes draft result.
 */
class AbstractSliceDraft {
    constructor() {
        this._onChooserToggled = new TriggerableMulticastDelegate();

        // Use sensible defaults, caller can override.
        this._factionGenerator = new AbstractFactionGenerator();
        this._fixedSystemsGenerator = undefined;
        this._maxPlayerCount = 8;
        this._placeHyperlanes = new AbstractPlaceHyperlanes();
        this._sliceGenerator = undefined;
        this._sliceLayout = undefined;
        this._speakerIndex = undefined; // random unless overridden
        this._turnOrder = undefined; // random unless overridden
        this._turnOrderType = TURN_ORDER_TYPE.SNAKE;

        this._customCheckBoxes = []; // {name, default, onCheckStateChanged}
        this._customSliders = []; // {name, min, max, default, onValueChanged}

        this._customInput = ""; // player specified slices, factions, labels, etc

        // Draft-time memory.  Chooser is desk index.  Should be able to
        // save/restore everything here to regerate a draft in progress.
        this._sliceShape = undefined;
        this._slices = undefined;
        this._labels = undefined;
        this._factions = undefined;
        this._fixedSystems = undefined;

        this._chooserToFaction = {};
        this._chooserToSeatIndex = {};
        this._chooserToSlice = {};
        this._origTurnOrder = undefined;
    }

    get onChooserToggled() {
        return this._onChooserToggled;
    }

    _attemptToggle(clickingPlayer, chooserToX, x, categoryName, selectionName) {
        assert(clickingPlayer instanceof Player);
        assert(chooserToX instanceof Object);
        assert(x !== undefined);
        assert(typeof categoryName === "string");
        assert(typeof selectionName === "string");

        const playerSlot = clickingPlayer.getSlot();
        const playerName = clickingPlayer.getName(); // use steam name, not current color
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const chooser = playerDesk?.index;
        const oldChoice = chooserToX[chooser];

        // Must be seated.
        if (!playerDesk) {
            const msg = locale("ui.draft.not_seated");
            Broadcast.chatAll(msg, Broadcast.ERROR);
            return false;
        }

        // If this is their current selection, toggle it off.
        if (oldChoice === x) {
            const msg = locale("ui.draft.deselected", {
                playerName,
                categoryName,
                selectionName,
            });
            Broadcast.chatAll(msg, playerDesk.chatColor);
            delete chooserToX[chooser];
            this._onChooserToggled.trigger();
            return true; // toggle off
        }

        // If this player has a different selection do not swap (must clear first).
        if (oldChoice) {
            const msg = locale("ui.draft.already_have", {
                playerName,
                categoryName,
                selectionName,
            });
            Broadcast.chatAll(msg, playerDesk.chatColor);
            return false;
        }

        // If another player has this item selected reject claiming it.
        for (const chosen of Object.values(chooserToX)) {
            if (chosen === x) {
                const msg = locale("ui.draft.already_claimed", {
                    playerName,
                    categoryName,
                    selectionName,
                });
                Broadcast.chatAll(msg, playerDesk.chatColor);
                return false;
            }
        }

        const msg = locale("ui.draft.selected", {
            playerName,
            categoryName,
            selectionName,
        });
        Broadcast.chatAll(msg, playerDesk.chatColor);
        chooserToX[chooser] = x;
        this._onChooserToggled.trigger();
        return true; // toggle on
    }

    attemptToggleFaction(clickingPlayer, factionNsidName) {
        assert(clickingPlayer instanceof Player);
        AbstractUtil.assertIsFaction(factionNsidName);

        const faction = world.TI4.getFactionByNsidName(factionNsidName);
        const categoryName = locale("ui.draft.category.faction");
        const selectionName = faction.nameAbbr;

        return this._attemptToggle(
            clickingPlayer,
            this._chooserToFaction,
            factionNsidName,
            categoryName,
            selectionName
        );
    }

    attemptToggleSeatIndex(clickingPlayer, seatIndex) {
        assert(clickingPlayer instanceof Player);
        AbstractUtil.assertIsDeskIndex(seatIndex);

        const seatDesk = world.TI4.getAllPlayerDesks()[seatIndex];
        const categoryName = locale("ui.draft.category.seat");
        const selectionName = seatDesk.colorName;

        return this._attemptToggle(
            clickingPlayer,
            this._chooserToSeatIndex,
            seatIndex,
            categoryName,
            selectionName
        );
    }

    attemptToggleSlice(clickingPlayer, slice) {
        assert(clickingPlayer instanceof Player);
        AbstractUtil.assertIsSlice(slice, this._sliceGenerator.getSliceShape());

        const categoryName = locale("ui.draft.category.slice");
        const selectionName = slice._label || `[${slice.join(" ")}]`;

        return this._attemptToggle(
            clickingPlayer,
            this._chooserToSlice,
            slice,
            categoryName,
            selectionName
        );
    }

    clearChooserFaction(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        delete this._chooserToFaction[chooser];
        return this;
    }

    getChooserFaction(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        return this._chooserToFaction[chooser];
    }

    setChooserFaction(chooser, factionNsidName) {
        AbstractUtil.assertIsDeskIndex(chooser);
        AbstractUtil.assertIsFaction(factionNsidName);
        this._chooserToFaction[chooser] = factionNsidName;
        return this;
    }

    clearChooserSeatIndex(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        delete this._chooserToSeatIndex[chooser];
        return this;
    }

    getChooserSeatIndex(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        return this._chooserToSeatIndex[chooser];
    }

    setChooserSeatIndex(chooser, seatIndex) {
        AbstractUtil.assertIsDeskIndex(chooser);
        AbstractUtil.assertIsDeskIndex(seatIndex);
        this._chooserToSeatIndex[chooser] = seatIndex;
        return this;
    }

    clearChooserSlice(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        delete this._chooserToSlice[chooser];
        return this;
    }

    getChooserSlice(chooser) {
        AbstractUtil.assertIsDeskIndex(chooser);
        return this._chooserToSlice[chooser];
    }

    setChooserSlice(chooser, slice) {
        AbstractUtil.assertIsDeskIndex(chooser);
        AbstractUtil.assertIsSlice(slice, this._sliceGenerator.getSliceShape());
        this._chooserToSlice[chooser] = slice;
        return this;
    }

    addCustomCheckBox(params) {
        assert(typeof params.name === "string");
        assert(typeof params.default === "boolean");
        assert(typeof params.onCheckStateChanged === "function");
        this._customCheckBoxes.push(params);
        return this;
    }

    getCustomCheckBoxes() {
        return this._customCheckBoxes;
    }

    addCustomSlider(params) {
        assert(typeof params.name === "string");
        assert(typeof params.min === "number");
        assert(typeof params.max === "number");
        assert(typeof params.default === "number");
        assert(typeof params.onValueChanged === "function");
        this._customSliders.push(params);
        return this;
    }

    getCustomSliders() {
        return this._customSliders;
    }

    getCustomInput() {
        return this._customInput;
    }

    setCustomInput(customInput) {
        assert(typeof customInput === "string");
        this._customInput = customInput;
        return this;
    }

    getFactionGenerator() {
        return this._factionGenerator;
    }

    setFactionGenerator(factionGenerator) {
        assert(factionGenerator instanceof AbstractFactionGenerator);
        this._factionGenerator = factionGenerator;
        return this;
    }

    getFixedSystemsGenerator() {
        return this._fixedSystemsGenerator;
    }

    setFixedSystemsGenerator(fixedSystemsGenerator) {
        assert(fixedSystemsGenerator instanceof AbstractFixedSystemsGenerator);
        this._fixedSystemsGenerator = fixedSystemsGenerator;
        return this;
    }

    getLabel(sliceIndex) {
        let label;
        if (this._labels) {
            label = this._labels[sliceIndex];
        }
        if (!label) {
            label = `SLICE ${"ABCDEFGHIJKLMOPQRSTUVWXYZ"[sliceIndex]}`;
        }
        return label;
    }

    getMaxPlayerCount() {
        return this._maxPlayerCount;
    }

    setMaxPlayerCount(value) {
        assert(typeof value === "number");
        this._maxPlayerCount = value;
        return this;
    }

    getPlaceHyperlanes() {
        return this._placeHyperlanes;
    }

    setPlaceHyperlanes(placeHyperlanes) {
        assert(placeHyperlanes instanceof AbstractPlaceHyperlanes);
        this._placeHyperlanes = placeHyperlanes;
        return this;
    }

    getSliceGenerator() {
        return this._sliceGenerator;
    }

    setSliceGenerator(sliceGenerator) {
        assert(sliceGenerator instanceof AbstractSliceGenerator);
        this._sliceGenerator = sliceGenerator;
        return this;
    }

    getSliceLayout() {
        return this._sliceLayout;
    }

    setSliceLayout(sliceLayout) {
        assert(sliceLayout instanceof AbstractSliceLayout);
        this._sliceLayout = sliceLayout;
        return this;
    }

    getSpeakerIndex() {
        return this._speakerIndex;
    }

    setSpeakerIndex(speaker) {
        assert(speaker instanceof PlayerDesk);
        this._speakerIndex = speaker;
        return this;
    }

    randomizeSpeakerIndex() {
        this._speakerIndex = Math.floor(
            Math.random() * world.TI4.config.playerCount
        );
        return this;
    }

    getTurnOrder() {
        return this._turnOrder;
    }

    setTurnOrder(turnOrder) {
        assert(Array.isArray(turnOrder));
        for (const playerDesk of turnOrder) {
            assert(playerDesk instanceof PlayerDesk);
        }
        return this;
    }

    randomizeTurnOrder() {
        const playerDesksCopy = [...world.TI4.getAllPlayerDesks()];
        this._turnOrder = Shuffle.shuffle(playerDesksCopy);
        return this;
    }

    // --------------------------------

    isReadyToFinish() {
        const playerCount = world.TI4.config.playerCount;
        for (let chooser = 0; chooser < playerCount; chooser++) {
            if (this.getChooserSlice(chooser) === undefined) {
                return false;
            }
            if (this.getChooserFaction(chooser) === undefined) {
                return false;
            }
            if (this.getChooserSeatIndex(chooser) === undefined) {
                return false;
            }
        }
        return true;
    }

    getSlices() {
        assert(this._slices); // must call start to create
        return this._slices;
    }

    getFactionNsidNames() {
        assert(this._factions); // must call start to create
        return this._factions;
    }

    getFixedSystems() {
        return this._fixedSystems;
    }

    // --------------------------------

    start(player) {
        assert(!player || player instanceof Player);
        if (!world.__isMock) {
            console.log("AbstractSliceDraft.start");
        }

        // Must provide a slice generator.
        assert(this._sliceGenerator);
        this._sliceShape = this._sliceGenerator.getSliceShape();
        AbstractUtil.assertIsShape(this._sliceShape);

        this._chooserToFaction = {};
        this._chooserToSeatIndex = {};
        this._chooserToSlice = {};

        // Remember turn order to restore on cancel.
        this._origTurnOrder = world.TI4.turns.getTurnOrder();

        if (!this._turnOrder) {
            this.randomizeTurnOrder();
        }
        if (!this._speakerIndex) {
            this.randomizeSpeakerIndex();
        }

        // Apply turn order.
        world.TI4.turns.setTurnOrder(
            this._turnOrder,
            player,
            this._turnOrderType
        );

        const errors = [];

        // Parse/create slices.
        this._slices = AbstractSliceGenerator.parseCustomSlices(
            this._customInput,
            this._sliceShape,
            errors
        );
        const sliceCount = this._slices
            ? this._slices.length
            : this._sliceGenerator.getCount();
        this._labels = AbstractSliceGenerator.parseCustomLabels(
            this._customInput,
            sliceCount,
            errors
        );
        if (!this._slices) {
            this._slices = this._sliceGenerator.generateSlices(sliceCount);
        }
        AbstractUtil.assertIsSliceArray(this._slices, this._sliceShape);

        // Choose factions.
        this._factions = AbstractFactionGenerator.parseCustomFactions(
            this._customInput,
            errors
        );
        if (!this._factions) {
            const factionCount = this._factionGenerator.getCount();
            this._factions =
                this._factionGenerator.generateFactions(factionCount);
        }
        AbstractUtil.assertIsFactionArray(this._factions);

        // Create fixed systems.
        this._fixedSystems = [];
        if (this._fixedSystemsGenerator) {
            const fixedHexes = this._fixedSystemsGenerator.getFixedHexes();
            const fixedCount = fixedHexes.length;
            this._fixedSystems =
                AbstractFixedSystemsGenerator.parseCustomFixedSystems(
                    this._customInput,
                    fixedCount,
                    errors
                );
            if (!this._fixedSystems) {
                this._fixedSystems =
                    this._fixedSystemsGenerator.generateFixedSystems();
            }
        }
        AbstractUtil.assertValidSystems(this._fixedSystems);

        // Make sure no errors before proceeding.
        if (errors.length > 0) {
            let msg = errors.join(", ");
            msg = locale("ui.draft.start_error", { msg });
            Broadcast.chatAll(msg, Broadcast.ERROR);
            return this;
        }

        // Create UI.
        // XXX TODO

        // Disable desk UI (except for take seat).
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(true);
        }

        return this;
    }

    cancel(player) {
        assert(player instanceof Player);
        if (!world.__isMock) {
            console.log("AbstractSliceDraft.cancel");
        }

        if (this._origTurnOrder) {
            world.TI4.turns.setTurnOrder(
                this._origTurnOrder,
                player,
                TURN_ORDER_TYPE.FORWARD
            );
            this._origTurnOrder = undefined;
        }

        // Dismiss UI.
        // XXX TODO

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }

        return this;
    }

    finish(player) {
        assert(player instanceof Player);
        if (!world.__isMock) {
            console.log("AbstractSliceDraft.finish");
        }

        AbstractSliceDraft._setTurnOrderFromSpeaker(this._speakerIndex, player);

        this._setupMap();
        this._moveSpeakerToken();
        this._dealFactionCards();
        this._movePlayersToSeats();

        return this;
    }

    // --------------------------------

    static _setTurnOrderFromSpeaker(speakerIndex, player) {
        AbstractUtil.assertIsDeskIndex(speakerIndex);
        assert(player instanceof Player);

        // Set turn order according to draft speaker position.
        const playerDesks = world.TI4.getAllPlayerDesks();

        const turnOrder = [];
        for (let offset = 0; offset < playerDesks.length; offset++) {
            const index = (speakerIndex + offset) % playerDesks.length;
            turnOrder.push(playerDesks[index]);
        }

        world.TI4.turns.setTurnOrder(
            turnOrder,
            player,
            TURN_ORDER_TYPE.FORWARD
        );
    }

    _moveSpeakerToken() {
        const speakerDeskIndex = this.getSpeakerIndex();
        AbstractUtil.assertIsDeskIndex(speakerDeskIndex);

        const playerDesks = world.TI4.getAllPlayerDesks();
        const speakerDesk = playerDesks[speakerDeskIndex];
        assert(speakerDesk);

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
    }

    _setupMap() {
        const { mapString } = UiMap.generateMapString(this, {
            zeroHomeSystems: true,
        });
        console.log(`AbstractSliceDraft._setupMap: ${mapString}`);
        MapStringLoad.moveGenericHomeSystemTiles(mapString);
        MapStringLoad.load(mapString);
    }

    _dealFactionCards() {
        const playerCount = world.TI4.config.playerCount;
        const playerDesks = world.TI4.getAllPlayerDesks();
        for (let chooser = 0; chooser < playerCount; chooser++) {
            const deskIndex = this.getChooserSeatIndex(chooser);
            const factionNsidName = this.getChooserFaction(chooser);
            AbstractUtil.assertIsDeskIndex(deskIndex);
            AbstractUtil.assertIsFaction(factionNsidName);
            const playerDesk = playerDesks[deskIndex];
            assert(playerDesk);

            const factionReference =
                FactionToken.findOrSpawnFactionReference(factionNsidName);
            if (factionReference) {
                factionReference.setPosition(playerDesk.center.add([0, 0, 10]));
                factionReference.setRotation(
                    new Rotator(0, 0, 180).compose(playerDesk.rot)
                );
            } else {
                console.log(
                    `AbstractSliceDraft._dealFactionCards: NO FACTION REFERENCE`
                );
            }

            playerDesk.setReady(false);
        }
    }

    _movePlayersToSeats() {
        // Remember players' original locations.
        const chooserToPlayer = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const player = world.getPlayerBySlot(playerDesk.playerSlot);
            if (player) {
                chooserToPlayer[playerDesk.index] = player;
            }
        }

        // Move all players to non-seat slots.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.unseatPlayer();
        }

        // Wait a frame to make sure player is fully removed from slot.
        const delayedFinishMove = () => {
            const playerCount = world.TI4.config.playerCount;
            const playerDesks = world.TI4.getAllPlayerDesks();
            for (let chooser = 0; chooser < playerCount; chooser++) {
                const deskIndex = this.getChooserSeatIndex(chooser);
                AbstractUtil.assertIsDeskIndex(deskIndex);
                const dstPlayerDesk = playerDesks[deskIndex];
                assert(dstPlayerDesk);
                const player = chooserToPlayer[chooser];
                if (!player) {
                    continue;
                }
                dstPlayerDesk.seatPlayer(player);
            }
        };
        process.nextTick(delayedFinishMove);
    }
}

module.exports = {
    AbstractSliceDraft,
};
