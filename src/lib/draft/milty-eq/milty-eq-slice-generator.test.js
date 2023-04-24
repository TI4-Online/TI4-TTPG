require("../../../global");
const assert = require("assert");
const { MiltyEqSliceGenerator } = require("./milty-eq-slice-generator");

it("constructor", () => {
    new MiltyEqSliceGenerator();
});

it("getRedTileNumbers", () => {
    const reds = MiltyEqSliceGenerator._getRedTileNumbers();
    assert(Array.isArray(reds));
    assert(reds.includes(43));
    assert(!reds.includes(18));
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
        const value = MiltyEqSliceGenerator._weightedChoice(options);
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

it("_chooseEqsTileTypes", () => {
    let playerCount = 6;
    let eqsTileTypes = MiltyEqSliceGenerator._chooseEqsTileTypes(playerCount);
    assert(eqsTileTypes.length === playerCount);
    eqsTileTypes.forEach((tileType) => {
        assert(typeof tileType === "string");
    });

    playerCount = 4;
    eqsTileTypes = MiltyEqSliceGenerator._chooseEqsTileTypes(playerCount);
    assert(eqsTileTypes.length === playerCount);
    eqsTileTypes.forEach((tileType) => {
        assert(typeof tileType === "string");
    });
});

it("_chooseOneSliceTileTypes", () => {
    const bunkerTileTypes = MiltyEqSliceGenerator._chooseOneSliceTileTypes();
    assert.equal(bunkerTileTypes.length, 4);
});

it("promoteWormhole", () => {
    const wormholeType = "alpha";
    const active = [1, 2, 3];
    const unused = [4, 26, 6]; // 26 is alpha
    let success = MiltyEqSliceGenerator._promoteWormhole(
        wormholeType,
        active,
        unused
    );
    assert(success);
    assert.deepEqual(active, [2, 3, 26]);
    assert.deepEqual(unused, [4, 6, 1]);

    // Try again, no wormholes available.
    success = MiltyEqSliceGenerator._promoteWormhole(
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
    let success = MiltyEqSliceGenerator._promoteWormholeRandomizeTier(
        wormholeType,
        actives,
        unuseds
    );
    assert(success);

    // Try again, no wormholes available.
    success = MiltyEqSliceGenerator._promoteWormholeRandomizeTier(
        wormholeType,
        actives,
        unuseds
    );
    assert(!success);
});

it("normal use", () => {
    const result = new MiltyEqSliceGenerator()
        .setSliceCount(6)
        .pickEqsTileTypes()
        .pickSliceTileTypes()
        .pickEqsTileTypes()
        .pickRedTiles()
        .assignRedTiles()
        .maybeDowngradeOtherWithGoodRed() // do before picking blue
        .pickBlueTiles()
        .maybeSwapInWormholes()
        .maybeSwapInLegendaries()
        .assignBlueTiles()
        .separateAnomalies()
        .fixBadSlices()
        .generate();
    assert(result);
});

it("different player counts", () => {
    for (let playerCount = 2; playerCount <= 6; playerCount++) {
        const result = new MiltyEqSliceGenerator()
            .setSliceCount(playerCount + 2)
            .setPlayerCount(playerCount)
            .simpleGenerate();
        assert.equal(result.eqs.length, playerCount);
        assert.equal(result.slices.length, playerCount + 2);
    }
});
