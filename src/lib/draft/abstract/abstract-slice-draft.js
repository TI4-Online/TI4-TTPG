const assert = require("../../../wrapper/assert-wrapper");
const { AbstractFactionGenerator } = require("./abstract-faction-generator");
const {
    AbstractFixedSystemsGenerator,
} = require("./abstract-fixed-systems-generator");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { AbstractSliceGenerator } = require("./abstract-slice-generator");
const { PlayerDesk } = require("../../player-desk/player-desk");
const { Shuffle } = require("../../shuffle");
const { TURN_ORDER_TYPE } = require("../../turns");
const { Player, world } = require("../../../wrapper/api");
const { AbstractUtil } = require("./abstract-util");
const { AbstractSliceLayout } = require("./abstract-slice-layout");

/**
 * Overall draft controller.  Draws draft UI, manages draft, executes draft result.
 */
class AbstractSliceDraft {
    constructor() {
        // Use sensible defaults, caller can override.
        this._factionGenerator = new AbstractFactionGenerator();
        this._fixedSystemsGenerator = undefined;
        this._maxPlayerCount = 8;
        this._placeHyperlanes = new AbstractPlaceHyperlanes();
        this._sliceGenerator = undefined;
        this._sliceLayout = undefined;
        this._speaker = undefined; // random unless overridden
        this._turnOrder = undefined; // random unless overridden
        this._turnOrderType = TURN_ORDER_TYPE.SNAKE;

        this._customCheckBoxes = []; // {name, default, onCheckStateChanged}
        this._customSliders = []; // {name, min, max, default, onValueChanged}

        // Draft-time memory.  Chooser is desk index.  Should be able to
        // save/restore everything here to regerate a draft in progress.
        this._slices = undefined;
        this._factions = undefined;
        this._fixedSystems = undefined;
        this._chooserToFaction = {};
        this._chooserToSeatIndex = {};
        this._chooserToSlice = {};
        this._origTurnOrder = undefined;
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

    addCustomSlider(params) {
        assert(typeof params.name === "string");
        assert(typeof params.min === "number");
        assert(typeof params.max === "number");
        assert(typeof params.default === "number");
        assert(typeof params.onValueChanged === "function");
        this._customSliders.push(params);
        return this;
    }

    getCustomCheckBoxes() {
        return this._customCheckBoxes;
    }

    getCustomSlices() {
        return this._customSliders;
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

    getSpeaker() {
        return this._speaker;
    }

    setSpeaker(speaker) {
        assert(speaker instanceof PlayerDesk);
        this._speaker = speaker;
        return this;
    }

    randomizeSpeaker() {
        const playerDesksCopy = [...world.TI4.getAllPlayerDesks()];
        this._speaker = Shuffle.shuffle(playerDesksCopy)[0];
    }

    getTurnOrder() {
        return this._turnOrder;
    }

    setTurnOrder(turnOrder) {
        assert(Array.isArray(turnOrder));
        for (const playerDesk of turnOrder) {
            assert(playerDesk instanceof PlayerDesk);
        }
    }

    randomizeTurnOrder() {
        const playerDesksCopy = [...world.TI4.getAllPlayerDesks()];
        this._turnOrder = Shuffle.shuffle(playerDesksCopy);
    }

    // --------------------------------

    start(player) {
        assert(player instanceof Player);

        // Must provide a slice generator.
        assert(this._sliceGenerator);

        this._chooserToFaction = {};
        this._chooserToSeatIndex = {};
        this._chooserToSlice = {};

        // Remember turn order to restore on cancel.
        this._origTurnOrder = world.TI4.turns.getTurnOrder();

        if (!this._turnOrder) {
            this.randomizeTurnOrder();
        }
        if (!this._speaker) {
            this.randomizeSpeaker();
        }

        // Apply turn order.
        world.TI4.turns.setTurnOrder(
            this._turnOrder,
            player,
            this._turnOrderType
        );

        // Create slices.
        const sliceCount = this._sliceGenerator.getCount();
        const slices = this._sliceGenerator.generateSlices(sliceCount);
        const shape = this._sliceGenerator.getSliceShape();
        AbstractUtil.assertIsShape(shape);
        AbstractUtil.assertIsSliceArray(slices, shape);

        // Choose factions.
        const factionCount = this._factionGenerator.getCount();
        const factionNsidNames =
            this._factionGenerator.generateFactions(factionCount);
        AbstractUtil.assertIsFactionArray(factionNsidNames);

        // Create fixed systems.
        let fixedSystems = {};
        if (this._fixedSystemsGenerator) {
            fixedSystems = this._fixedSystemsGenerator.generateFixedSystems();
            AbstractUtil.assertIsHexToTile(fixedSystems);
        }

        // Create UI.
        // XXX TODO
    }

    cancel(player) {
        assert(player instanceof Player);

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
    }

    finish(player) {
        assert(player instanceof Player);

        AbstractSliceDraft._setTurnOrderFromSpeaker(this._speaker, player);

        // TODO
    }

    // --------------------------------

    static _setTurnOrderFromSpeaker(speaker, player) {
        assert(speaker instanceof PlayerDesk);
        assert(player instanceof Player);

        // Set turn order according to draft speaker position.
        const playerDesks = world.TI4.getAllPlayerDesks();

        let speakerIndex = -1;
        for (const playerDesk of playerDesks) {
            if (playerDesk === speaker) {
                speakerIndex = playerDesk.index;
                break;
            }
        }
        assert(speakerIndex >= 0);

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
}

module.exports = {
    AbstractSliceDraft,
};
