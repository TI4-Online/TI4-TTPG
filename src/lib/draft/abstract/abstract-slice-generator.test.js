require("../../../global"); // creates world.TI4
const assert = require("assert");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { world } = require("../../../wrapper/api");

it("_hasAdjacentAnomalies", () => {
    const miltyShape = [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ];
    const slice1 = [1, 2, 3, 4, 5];
    const slice2 = [41, 42, 1, 2, 3];

    assert(!AbstractSliceGenerator._hasAdjacentAnomalies(slice1, miltyShape));
    assert(AbstractSliceGenerator._hasAdjacentAnomalies(slice2, miltyShape));
});

it("_separateAnomalies", () => {
    const miltyShape = [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ];
    const slice = [41, 42, 1, 2, 3];

    const newSlice = AbstractSliceGenerator._separateAnomalies(
        slice,
        miltyShape
    );

    assert(!AbstractSliceGenerator._hasAdjacentAnomalies(newSlice, miltyShape));
});

it("permutator", () => {
    const array = [1, 2, 3];
    const result = [];
    AbstractSliceGenerator._permutator(array, (permutation) => {
        result.push(permutation);
    });
    assert.deepEqual(result, [
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1],
    ]);
});

it("weightedChoice", () => {
    const options = [
        { weight: 1, value: "a" },
        { weight: 3, value: "b" },
        { weight: 6, value: "c" },
    ];
    let a = 0,
        b = 0,
        c = 0;
    for (let i = 0; i < 1000; i++) {
        const value = AbstractSliceGenerator._weightedChoice(options);
        if (value === "a") {
            a++;
        } else if (value === "b") {
            b++;
        } else if (value === "c") {
            c++;
        } else {
            throw new Error("invalid");
        }
    }
    //console.log(`${a}/${b}/${c}`);
    assert(a < b / 2);
    assert(a < c / 4);
});

it("parseCustomSlices", () => {
    const shape = SLICE_SHAPES.milty;

    // All valid.
    let custom = "foo&slices=1,2,3,4,5|6,7,8,9,10";
    let errors = [];
    let slices = AbstractSliceGenerator.parseCustomSlices(
        custom,
        shape,
        errors
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);

    // Slices can be given without descriminator.
    custom = "1,2,3,4,5|6,7,8,9,10&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, []);
    assert.deepEqual(slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);

    // bad slice.
    custom = "1,2,3,4,5|6,7,8,9,10,11,12&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, ["slice length (7) must be 5"]);
    assert.deepEqual(slices, [[1, 2, 3, 4, 5]]);

    // bad slice 2.
    custom = "1,2,3,4,5|6,7,8,9,ten&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, ['Slice entry "ten" is not a number']);
    assert.deepEqual(slices, [[1, 2, 3, 4, 5]]);
});

it("parseCustomLabels", () => {
    const sliceCount = 2;

    // All valid.
    let custom = "foo&labels=one|two";
    let errors = [];
    let labels = AbstractSliceGenerator.parseCustomLabels(
        custom,
        sliceCount,
        errors
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(labels, ["one", "two"]);

    custom = "foo&labels=one";
    errors = [];
    labels = AbstractSliceGenerator.parseCustomLabels(
        custom,
        sliceCount,
        errors
    );
    assert.deepEqual(errors, [
        "label count (1) does not match slice count (2)",
    ]);
    assert.deepEqual(labels, ["one"]);
});

it("_getMatchingTilesAndShiftToFront", () => {
    const tiered = {
        high: [1, 2, 3, 4],
        med: [5, 6, 7, 8],
        low: [9, 10, 11, 12],
        red: [13, 14, 15, 16],
    };
    const filter = (system) => {
        return system.tile % 2 === 1; // odd tile numbers
    };
    const matching = AbstractSliceGenerator._getMatchingTilesAndShiftToFront(
        tiered,
        filter
    );
    assert.deepEqual(matching, [1, 3, 5, 7, 9, 11, 13, 15]);
    assert.deepEqual(tiered, {
        high: [3, 1, 2, 4],
        med: [7, 5, 6, 8],
        low: [11, 9, 10, 12],
        red: [15, 13, 14, 16],
    });
});

it("_getAllWormholeTiles", () => {
    const tiered = {
        high: [1, 2, 25, 3, 4, 26],
        med: [],
        low: [],
        red: [],
    };
    const matching = AbstractSliceGenerator._getAllWormholeTiles(tiered);
    assert.deepEqual(matching, [25, 26]);
    assert.deepEqual(tiered, {
        high: [26, 25, 1, 2, 3, 4],
        med: [],
        low: [],
        red: [],
    });
});

it("_getAllLegendaryTiles", () => {
    const tiered = {
        high: [1, 2, 65, 3, 4, 66],
        med: [],
        low: [],
        red: [],
    };
    const matching = AbstractSliceGenerator._getAllLegendaryTiles(tiered);
    assert.deepEqual(matching, [65, 66]);
    assert.deepEqual(tiered, {
        high: [66, 65, 1, 2, 3, 4],
        med: [],
        low: [],
        red: [],
    });
});

it("_promote", () => {
    const chosenTiles = {
        high: [1, 2, 3],
        med: [4, 5, 6],
        low: [7, 8, 9],
        red: [10, 11, 12],
    };
    const remainingTiles = {
        high: [21, 22, 23],
        med: [24, 25, 26],
        low: [27, 28, 29],
        red: [30, 31, 32],
    };

    // Try to promote already chosen tiles.
    AbstractSliceGenerator._promote(1, chosenTiles, remainingTiles);
    AbstractSliceGenerator._promote(5, chosenTiles, remainingTiles);
    AbstractSliceGenerator._promote(9, chosenTiles, remainingTiles);
    assert.deepEqual(chosenTiles, {
        high: [1, 2, 3],
        med: [4, 5, 6],
        low: [7, 8, 9],
        red: [10, 11, 12],
    });
    assert.deepEqual(remainingTiles, {
        high: [21, 22, 23],
        med: [24, 25, 26],
        low: [27, 28, 29],
        red: [30, 31, 32],
    });

    // Now promote some remaining tiles.
    AbstractSliceGenerator._promote(21, chosenTiles, remainingTiles);
    AbstractSliceGenerator._promote(25, chosenTiles, remainingTiles);
    AbstractSliceGenerator._promote(29, chosenTiles, remainingTiles);
    assert.deepEqual(chosenTiles, {
        high: [21, 1, 2],
        med: [25, 4, 5],
        low: [29, 7, 8],
        red: [10, 11, 12],
    });
    assert.deepEqual(remainingTiles, {
        high: [22, 23, 3],
        med: [24, 26, 6],
        low: [27, 28, 9],
        red: [30, 31, 32],
    });
});

it("_getRandomTieredSystemsWithLegendaryWormholePromotion", () => {
    const options = {
        high: 3,
        med: 4,
        low: 5,
        red: 6,
        minWormholes: 5,
        minLegendary: 2,
    };
    const tiered =
        AbstractSliceGenerator._getRandomTieredSystemsWithLegendaryWormholePromotion(
            options
        );

    const allTiles = [];
    allTiles.push(...tiered.high);
    allTiles.push(...tiered.med);
    allTiles.push(...tiered.low);
    allTiles.push(...tiered.red);

    // Make sure numbers match.
    assert.equal(tiered.high.length, options.high);
    assert.equal(tiered.med.length, options.med);
    assert.equal(tiered.low.length, options.low);
    assert.equal(tiered.red.length, options.red);

    // Wormholes?
    const wormholes = allTiles.filter((tile) => {
        const system = world.TI4.getSystemByTileNumber(tile);
        return system.wormholes.length > 0;
    });
    assert(wormholes.length >= options.minWormholes);

    // Legendaries?
    const legendaries = allTiles.filter((tile) => {
        const system = world.TI4.getSystemByTileNumber(tile);
        return system.legendary;
    });
    assert(legendaries.length >= options.minLegendary);

    // It also gave us unused tiles in case we need options.
    assert(tiered.remainingTiles.high.length > 0);
    assert(tiered.remainingTiles.med.length > 0);
    assert(tiered.remainingTiles.low.length > 0);
    assert(tiered.remainingTiles.red.length > 0);
});
