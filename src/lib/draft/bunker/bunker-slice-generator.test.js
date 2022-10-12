require("../../../global");
const assert = require("assert");
const { BunkerSliceGenerator, TILE_TYPE } = require("./bunker-slice-generator");

it("constructor", () => {
    new BunkerSliceGenerator();
});

it("getRedTileNumbers", () => {
    const reds = BunkerSliceGenerator._getRedTileNumbers();
    assert(Array.isArray(reds));
    assert(reds.includes(43));
    assert(!reds.includes(18));
});

it("weightedChoice", () => {
    const options = [
        { weight: 1, value: "a" },
        { weight: 3, value: "b" },
    ];
    let a = 0,
        b = 0;
    for (let i = 0; i < 100; i++) {
        const value = BunkerSliceGenerator._weightedChoice(options);
        if (value === "a") {
            a++;
        } else if (value === "b") {
            b++;
        } else {
            throw new Error("invalid");
        }
    }
    assert(a < b / 2);
});

it("getNumInnerReds", () => {
    const bunkerCount = 6;
    const value = BunkerSliceGenerator._getNumInnerReds(bunkerCount);
    assert(value > 0);
});

it("getBunkerTileTypes", () => {
    const bunkerCount = 6;
    const numInnerReds = 3;
    const bunkerTileTypesArray = BunkerSliceGenerator._getBunkerTileTypes(
        bunkerCount,
        numInnerReds
    );

    let numReds = 0;
    let numOther = 0;
    for (const bunkerTileTypes of bunkerTileTypesArray) {
        assert.equal(bunkerTileTypes.length, 4);
        for (const bunkerTileType of bunkerTileTypes) {
            if (bunkerTileType === TILE_TYPE.RED) {
                numReds += 1;
            } else {
                numOther += 1;
            }
        }
    }
    assert.equal(numReds, bunkerCount * 2 - numInnerReds);
    assert.equal(numOther, bunkerCount * 4 - numReds);
});

it("getInnerRingTileTypes", () => {
    const bunkerCount = 6;
    const numInnerReds = 3;
    const tileTypes = BunkerSliceGenerator._getInnerRingTileTypes(
        bunkerCount,
        numInnerReds
    );

    let numReds = 0;
    let numOther = 0;
    assert.equal(tileTypes.length, bunkerCount);
    for (const tileType of tileTypes) {
        if (tileType === TILE_TYPE.RED) {
            numReds += 1;
        } else {
            numOther += 1;
        }
    }
    assert.equal(numReds, numInnerReds);
    assert.equal(numOther, bunkerCount - numInnerReds);
});

it("promoteWormhole", () => {
    const wormholeType = "alpha";
    const active = [1, 2, 3];
    const unused = [4, 26, 6]; // 26 is alpha
    let success = BunkerSliceGenerator._promoteWormhole(
        wormholeType,
        active,
        unused
    );
    assert(success);
    assert.deepEqual(active, [2, 3, 26]);
    assert.deepEqual(unused, [4, 6, 1]);

    // Try again, no wormholes available.
    success = BunkerSliceGenerator._promoteWormhole(
        wormholeType,
        active,
        unused
    );
    assert(!success);
});

it("promoteWormholeRandomizeTier", () => {
    const wormholeType = "alpha";
    const actives = { high: [1], med: [2], low: [3], red: [4] };
    const unuseds = { high: [5], med: [6], low: [7], red: [26] };
    let success = BunkerSliceGenerator._promoteWormholeRandomizeTier(
        wormholeType,
        actives,
        unuseds
    );
    assert(success);

    // Try again, no wormholes available.
    success = BunkerSliceGenerator._promoteWormholeRandomizeTier(
        wormholeType,
        actives,
        unuseds
    );
    assert(!success);
});

it("normal use", () => {
    const result = new BunkerSliceGenerator()
        .setBunkerCount(6)
        .pickNumInnerReds()
        .pickBunkerTileTypes()
        .pickInnerRingTileTypes()
        .pickRedTiles()
        .assignRedTiles()
        .maybeDowngradeOtherWithGoodRed() // do before picking blue
        .pickBlueTiles()
        .maybeSwapInWormholes()
        .maybeSwapInLegendaries()
        .assignBlueTiles()
        .separateAnomalies()
        .generate();
    assert(result);
});
