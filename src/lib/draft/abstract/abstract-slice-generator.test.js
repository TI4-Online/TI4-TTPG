require("../../../global"); // creates world.TI4
const assert = require("assert");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { world } = require("../../../wrapper/api");

const { HIGH, MED, LOW, RED } = world.TI4.SYSTEM_TIER;

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

it("_getMatchingTiles", () => {
    const tiered = {
        high: [1, 2, 3, 4],
        med: [5, 6, 7, 8],
        low: [9, 10, 11, 12],
        red: [13, 14, 15, 16],
    };
    const filter = (system) => {
        return system.tile % 2 === 1; // odd tile numbers
    };
    const matching = AbstractSliceGenerator._getMatchingTiles(tiered, filter);
    assert.deepEqual(matching, [1, 3, 5, 7, 9, 11, 13, 15]);
});

it("_getAllWormholeTiles", () => {
    const tiered = {
        high: [1, 2, 25, 3, 4, 26],
        med: [],
        low: [],
        red: [],
    };

    let matching = AbstractSliceGenerator._getAllWormholeTiles(tiered, "alpha");
    assert.deepEqual(matching, [26]);

    matching = AbstractSliceGenerator._getAllWormholeTiles(tiered, "beta");
    assert.deepEqual(matching, [25]);
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
        high: [21, 1, 2, 3],
        med: [25, 4, 5, 6],
        low: [29, 7, 8, 9],
        red: [10, 11, 12],
    });
    assert.deepEqual(remainingTiles, {
        high: [22, 23],
        med: [24, 26],
        low: [27, 28],
        red: [30, 31, 32],
    });
});

it("_getRandomTieredSystemsWithLegendaryWormholePromotion", () => {
    const options = {
        minAlphaWormholes: 3,
        minBetaWormholes: 3,
        minLegendary: 2,
    };
    const { chosenTiles } =
        AbstractSliceGenerator._getRandomTieredSystemsWithLegendaryWormholePromotion(
            options
        );

    const allChosenTiles = [];
    allChosenTiles.push(...chosenTiles.high);
    allChosenTiles.push(...chosenTiles.med);
    allChosenTiles.push(...chosenTiles.low);
    allChosenTiles.push(...chosenTiles.red);

    // Alpha wormholes?
    const alphaWormholes = allChosenTiles.filter((tile) => {
        const system = world.TI4.getSystemByTileNumber(tile);
        return system.wormholes.includes("alpha");
    });
    assert(alphaWormholes.length >= options.minAlphaWormholes);

    // Beta wormholes?
    const betaWormholes = allChosenTiles.filter((tile) => {
        const system = world.TI4.getSystemByTileNumber(tile);
        return system.wormholes.includes("beta");
    });
    assert(betaWormholes.length >= options.minBetaWormholes);

    // Legendaries?
    const legendaries = allChosenTiles.filter((tile) => {
        const system = world.TI4.getSystemByTileNumber(tile);
        return system.legendary;
    });
    assert(legendaries.length >= options.minLegendary);
});

it("_fillSlicesWithRequiredTiles", () => {
    const tieredSlices = [
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
    ];
    const chosenTiles = {
        high: [11, 12, 13],
        med: [21, 22, 23, 24],
        low: [31, 32, 33, 34, 35, 36, 37],
        red: [41, 42, 43, 44, 45, 46, 47],
    };
    const slices = [];

    AbstractSliceGenerator._fillSlicesWithRequiredTiles(
        tieredSlices,
        chosenTiles,
        slices
    );

    assert.deepEqual(tieredSlices, [
        ["resolved", "red", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "med", "resolved"],
        ["resolved", "red", "resolved", "med", "resolved"],
        ["resolved", "red", "resolved", "resolved", "high"],
        ["resolved", "red", "resolved", "resolved", "high"],
        ["resolved", "red", "resolved", "resolved", "high"],
    ]);
    assert.deepEqual(chosenTiles, { high: [], low: [31], med: [], red: [] });
    assert.deepEqual(slices, [
        [13, 21, 32, 42],
        [12, 37, 47, 41],
        [11, 36, 46],
        [24, 35, 45],
        [23, 34, 44],
        [22, 33, 43],
    ]);
});

it("_fillSlicesWithRemainingTiles", () => {
    const tieredSlices = [
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
        [RED, RED, LOW, MED, HIGH],
    ];
    const remainingTiles = {
        high: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // 10
        med: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // 10
        low: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], // 10
        red: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53], // 13
    };
    const slices = [];

    AbstractSliceGenerator._fillSlicesWithRemainingTiles(
        tieredSlices,
        remainingTiles,
        slices
    );

    assert.deepEqual(tieredSlices, [
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
        ["resolved", "resolved", "resolved", "resolved", "resolved"],
    ]);
    assert.equal(remainingTiles.high.length, 4);
    assert.equal(remainingTiles.med.length, 4);
    assert.equal(remainingTiles.low.length, 4);
    assert.equal(remainingTiles.red.length, 1);
    assert.equal(slices.length, tieredSlices.length);
    assert.equal(slices[0].length, tieredSlices[0].length);
    assert.equal(slices[1].length, tieredSlices[1].length);
    assert.equal(slices[2].length, tieredSlices[2].length);
    assert.equal(slices[3].length, tieredSlices[3].length);
    assert.equal(slices[4].length, tieredSlices[4].length);
    assert.equal(slices[5].length, tieredSlices[5].length);
});

it("_calculateSliceScore", () => {
    let sliceSoFar = [
        25, // wormhole
        65, // legendary
    ];
    let withNewTile = 26; // wormhole

    let score = AbstractSliceGenerator._calculateSliceScore(
        sliceSoFar,
        withNewTile
    );
    assert.equal(score, 0.001);

    withNewTile = 66; // legendary
    score = AbstractSliceGenerator._calculateSliceScore(
        sliceSoFar,
        withNewTile
    );
    assert.equal(score, 0.001);
});
