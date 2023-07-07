require("../../../global");
const assert = require("assert");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { MockPlayer, world } = require("../../../wrapper/api");

class MySliceGenerator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty;
    }

    generateSlices(count) {
        const numTiles = this.getSliceShape().length - 1;
        const slices = [];
        for (let i = 0; i < count; i++) {
            const slice = new Array(numTiles).fill(i + 1);
            slices.push(slice);
        }
        return slices;
    }
}

it("start", () => {
    const player = new MockPlayer();
    const sliceGenerator = new MySliceGenerator();

    const sliceDraft = new AbstractSliceDraft().setSliceGenerator(
        sliceGenerator
    );
    sliceDraft.start(player);
    sliceDraft.cancel(player);
});

it("get/set faction", () => {
    const sliceDraft = new AbstractSliceDraft();
    const chooser = 1;
    const faction = "arborec";

    assert.equal(sliceDraft.getChooserFaction(chooser), undefined);
    sliceDraft.setChooserFaction(chooser, faction);
    assert.equal(sliceDraft.getChooserFaction(chooser), faction);
    sliceDraft.clearChooserFaction(chooser);
    assert.equal(sliceDraft.getChooserFaction(chooser), undefined);
});

it("get/set seat", () => {
    const sliceDraft = new AbstractSliceDraft();
    const chooser = 1;
    const seat = 2;

    assert.equal(sliceDraft.getChooserSeatIndex(chooser), undefined);
    sliceDraft.setChooserSeatIndex(chooser, seat);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), seat);
    sliceDraft.clearChooserSeatIndex(chooser);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), undefined);
});

it("get/set slice", () => {
    const sliceDraft = new AbstractSliceDraft().setSliceGenerator(
        new MySliceGenerator()
    );
    const chooser = 1;
    const slice = [21, 22, 23, 24, 25];

    assert.equal(sliceDraft.getChooserSlice(chooser), undefined);
    sliceDraft.setChooserSlice(chooser, slice);
    assert.deepEqual(sliceDraft.getChooserSlice(chooser), slice);
    sliceDraft.clearChooserSlice(chooser);
    assert.equal(sliceDraft.getChooserSlice(chooser), undefined);
});

it("_attemptToggle faction", () => {
    const sliceDraft = new AbstractSliceDraft();

    const chooser = 1;
    const playerSlot = world.TI4.getAllPlayerDesks()[chooser].playerSlot;
    const badPlayer = new MockPlayer({ slot: 99 });
    const goodPlayer = new MockPlayer({ slot: playerSlot });
    const choice = "arborec";
    const otherChoice = "sol";
    let success;

    // Unseated player fails.
    success = sliceDraft.attemptToggleFaction(badPlayer, choice);
    assert(!success);

    // Seated player succeeds.
    success = sliceDraft.attemptToggleFaction(goodPlayer, choice);
    assert(success);
    assert.equal(sliceDraft.getChooserFaction(chooser), choice);

    // Cannot chage while have a selection.
    success = sliceDraft.attemptToggleFaction(goodPlayer, otherChoice);
    assert(!success);
    assert.equal(sliceDraft.getChooserFaction(chooser), choice);

    // De-select current choice.
    success = sliceDraft.attemptToggleFaction(goodPlayer, choice);
    assert(success);
    assert.equal(sliceDraft.getChooserFaction(chooser), undefined);

    // Select new choice.
    success = sliceDraft.attemptToggleFaction(goodPlayer, otherChoice);
    assert(success);
    assert.equal(sliceDraft.getChooserFaction(chooser), otherChoice);
});

it("_attemptToggle seat", () => {
    const sliceDraft = new AbstractSliceDraft();

    const chooser = 1;
    const playerSlot = world.TI4.getAllPlayerDesks()[chooser].playerSlot;
    const badPlayer = new MockPlayer({ slot: 99 });
    const goodPlayer = new MockPlayer({ slot: playerSlot });
    const choice = 3;
    const otherChoice = 4;
    let success;

    // Unseated player fails.
    success = sliceDraft.attemptToggleSeatIndex(badPlayer, choice);
    assert(!success);

    // Seated player succeeds.
    success = sliceDraft.attemptToggleSeatIndex(goodPlayer, choice);
    assert(success);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), choice);

    // Cannot chage while have a selection.
    success = sliceDraft.attemptToggleSeatIndex(goodPlayer, otherChoice);
    assert(!success);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), choice);

    // De-select current choice.
    success = sliceDraft.attemptToggleSeatIndex(goodPlayer, choice);
    assert(success);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), undefined);

    // Select new choice.
    success = sliceDraft.attemptToggleSeatIndex(goodPlayer, otherChoice);
    assert(success);
    assert.equal(sliceDraft.getChooserSeatIndex(chooser), otherChoice);
});

it("_attemptToggle seat", () => {
    const sliceDraft = new AbstractSliceDraft().setSliceGenerator(
        new MySliceGenerator()
    );

    const chooser = 1;
    const playerSlot = world.TI4.getAllPlayerDesks()[chooser].playerSlot;
    const badPlayer = new MockPlayer({ slot: 99 });
    const goodPlayer = new MockPlayer({ slot: playerSlot });
    const choice = [21, 22, 23, 24, 25];
    const otherChoice = [31, 32, 33, 34, 35];
    let success;

    // Unseated player fails.
    success = sliceDraft.attemptToggleSlice(badPlayer, choice);
    assert(!success);

    // Seated player succeeds.
    success = sliceDraft.attemptToggleSlice(goodPlayer, choice);
    assert(success);
    assert.deepEqual(sliceDraft.getChooserSlice(chooser), choice);

    // Cannot chage while have a selection.
    success = sliceDraft.attemptToggleSlice(goodPlayer, otherChoice);
    assert(!success);
    assert.deepEqual(sliceDraft.getChooserSlice(chooser), choice);

    // De-select current choice.
    success = sliceDraft.attemptToggleSlice(goodPlayer, choice);
    assert(success);
    assert.equal(sliceDraft.getChooserSlice(chooser), undefined);

    // Select new choice.
    success = sliceDraft.attemptToggleSlice(goodPlayer, otherChoice);
    assert(success);
    assert.deepEqual(sliceDraft.getChooserSlice(chooser), otherChoice);
});
