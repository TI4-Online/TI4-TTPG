require("../../../global");
const assert = require("assert");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { UiMap } = require("./ui-map");
const { world } = require("../../../wrapper/api");
const {
    AbstractFixedSystemsGenerator,
} = require("./abstract-fixed-systems-generator");

it("deskIndexToColorTile", () => {
    for (const isHome of [false, true]) {
        for (
            let deskIndex = 0;
            deskIndex < world.TI4.config.playerCount;
            deskIndex++
        ) {
            const tile = UiMap.deskIndexToColorTile(deskIndex, isHome);
            const reverse = UiMap.tileToDeskIndexAndIsHome(tile);
            assert.equal(reverse.deskIndex, deskIndex);
            assert.equal(reverse.isHome, isHome);
        }
    }
});

it("generateMapString", () => {
    class DummySliceGeneator extends AbstractSliceGenerator {
        getSliceShape() {
            return SLICE_SHAPES.milty;
        }
    }

    const sliceLayout = new AbstractSliceLayout().setShape(SLICE_SHAPES.milty);

    // Mix of choses slices and "generalized for desk index" magic numbers.
    const sliceDraft = new AbstractSliceDraft()
        .setSliceGenerator(new DummySliceGeneator())
        .setSliceLayout(sliceLayout)
        .setChooserFaction(0, "arborec")
        .setChooserSeatIndex(0, 0)
        .setChooserSeatIndex(1, 2)
        .setChooserSeatIndex(2, 4)
        .setChooserSlice(0, [21, 22, 23, 24, 25])
        .setChooserSlice(1, [31, 32, 33, 34, 35])
        .setChooserSlice(2, [41, 42, 43, 44, 45]);

    // Include the home system tile numbers.
    let options = { includeHomeSystems: true };
    let result = UiMap.generateMapString(sliceDraft, options);
    assert.equal(
        result.mapString,
        "45 100010 25 100002 35 100006 42 44 100010 100010 22 24 100002 100002 32 34 100006 100006 100009 41 100010 100011 100010 23 5 21 100002 100003 100002 33 100005 31 100006 100007 100006 43"
    );
    assert.deepEqual(result.deskIndexToLabel, {
        0: '"white"\nARBOREC',
        2: '"blue"',
        4: '"purple"',
    });

    // Generalized home system tile encodings (player desk, not tile number).
    options = {};
    result = UiMap.generateMapString(sliceDraft, options);
    assert.equal(
        result.mapString,
        "45 100010 25 100002 35 100006 42 44 100010 100010 22 24 100002 100002 32 34 100006 100006 100009 41 100010 100011 100010 23 100001 21 100002 100003 100002 33 100005 31 100006 100007 100006 43"
    );

    // Use zeros for home systems.
    options = { zeroHomeSystems: true };
    result = UiMap.generateMapString(sliceDraft, options);
    assert.equal(
        result.mapString,
        "45 100010 25 100002 35 100006 42 44 100010 100010 22 24 100002 100002 32 34 100006 100006 0 41 100010 0 100010 23 0 21 100002 0 100002 33 0 31 100006 0 100006 43"
    );
});

it("generateMapString with fixed systems", () => {
    class DummySliceGeneator extends AbstractSliceGenerator {
        getSliceShape() {
            return SLICE_SHAPES.bunker;
        }
        generateSlices() {
            return [
                [21, 22, 23, 24],
                [31, 32, 33, 34],
                [41, 42, 43, 44],
                [51, 52, 53, 54],
                [61, 62, 63, 64],
                [71, 72, 73, 74],
            ];
        }
    }
    class DummyFixedSystemsGenerator extends AbstractFixedSystemsGenerator {
        getFixedHexes() {
            return [
                "<1,0,-1>", // north
                "<-1,0,1>", // south
            ];
        }
        generateFixedSystems() {
            return [61, 62];
        }
    }

    const sliceLayout = new AbstractSliceLayout().setShape(SLICE_SHAPES.bunker);

    // Mix of choses slices and "generalized for desk index" magic numbers.
    const sliceDraft = new AbstractSliceDraft()
        .setFixedSystemsGenerator(new DummyFixedSystemsGenerator())
        .setSliceGenerator(new DummySliceGeneator())
        .setSliceLayout(sliceLayout)
        .start() // start BEFORE setting choices
        .setChooserFaction(0, "arborec")
        .setChooserSeatIndex(0, 0)
        .setChooserSeatIndex(1, 1)
        .setChooserSeatIndex(2, 2)
        .setChooserSlice(0, [21, 22, 23, 24])
        .setChooserSlice(1, [31, 32, 33, 34])
        .setChooserSlice(2, [41, 42, 43, 44]);

    // Use zeros for home systems.
    const options = { zeroHomeSystems: true };
    const result = UiMap.generateMapString(sliceDraft, options);
    assert.equal(
        result.mapString,
        "61 -1 -1 62 -1 -1 100008 100010 100010 23 22 33 32 43 42 100006 100006 100008 100008 100010 0 100010 24 0 21 34 0 31 44 0 41 100006 0 100006 100008 0"
    );
});
