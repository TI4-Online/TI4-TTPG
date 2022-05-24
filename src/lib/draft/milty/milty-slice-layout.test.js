require("../../../global"); // register world.TI4
const assert = require("assert");
const { Hex } = require("../../hex");
const { MiltySliceLayout, SLICE_HEXES } = require("./milty-slice-layout");
const { Vector, world } = require("../../../wrapper/api");

it("_getAnchorPosition", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    const playerSlot = playerDesk.playerSlot;
    const pos = MiltySliceLayout._getAnchorPosition(playerSlot);
    assert(pos instanceof Vector);
});

it("_getTilePositions", () => {
    const anchorPos = new Vector(0, 0, 0);
    const yaw = 0;
    const posArray = MiltySliceLayout._getTilePositions(anchorPos, yaw);
    assert(Array.isArray(posArray));
    assert.equal(posArray.length, 6);
    const hexArray = posArray.map((pos) => {
        return Hex.fromPosition(pos);
    });
    assert.deepEqual(hexArray, SLICE_HEXES);
});

it("_toMapString", () => {
    const miltySliceString = "1 2 3 4 5";
    const playerDesk = world.TI4.getAllPlayerDesks()[1];
    const playerSlot = playerDesk.playerSlot;
    const mapString = MiltySliceLayout._toMapString(
        miltySliceString,
        playerSlot
    );
    assert(typeof mapString === "string");
    assert(mapString.length > 0);
    assert.equal(
        mapString,
        "{-1} -1 -1 -1 5 -1 -1 -1 -1 -1 -1 -1 -1 2 4 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 3 0 1"
    );
});

it("_toMapString w/ hyperlanes", () => {
    // "white" slice (south-east).  Hyperlanes will be south.
    // Tile "3" collides with a hyperlane tile.
    const mapString = "{0} 0 0 1 0 0 0 0 0 0 0 2 3 0 0 0 0 0 0 0 0 0 0 0 4 0 5";
    world.TI4.config.setPlayerCount(5);
    const revisedMapString = MiltySliceLayout._addHyperlanes(mapString);
    world.TI4.config.setPlayerCount(6);

    assert.equal(
        revisedMapString,
        "{0} 0 0 1 85A0 0 0 0 0 0 0 2 88A0 3 87A0 0 0 0 0 0 0 0 0 0 4 0 5 83A0 86A0 84A3"
    );
});

it("_toMapString w/ hyperlanes full", () => {
    // "white" slice (south-east).  Hyperlanes will be south.
    // Tile "3" collides with a hyperlane tile.
    const mapString =
        "{0} 0 65 0 34 0 40 0 0 63 30 0 0 32 43 0 0 42 76 0 0 50 0 77 0 0 0 25 0 39 0 0 0 24 0 35";
    world.TI4.config.setPlayerCount(3);
    const revisedMapString = MiltySliceLayout._addHyperlanes(mapString);
    world.TI4.config.setPlayerCount(6);

    assert.equal(
        revisedMapString,
        "{0} 85A3 65 85A5 34 85A1 40 76 87A3 63 88A5 30 87A5 32 87A3 43 88A5 42 88A3 86A3 84A3 50 0 77 83A2 86A5 84A5 25 0 39 84A3 86A1 83A2 24 0 35 83A0"
    );
});

it("_toMapString w/ hyperlanes full (2)", () => {
    // "white" slice (south-east).  Hyperlanes will be south.
    // Tile "3" collides with a hyperlane tile.
    const mapString =
        "{0} 0 59 0 69 0 68 0 0 30 45 0 0 66 79 0 0 26 63 0 0 39 0 64 0 0 0 67 0 25 0 0 0 80 0 32";
    world.TI4.config.setPlayerCount(3);
    const revisedMapString = MiltySliceLayout._addHyperlanes(mapString);
    world.TI4.config.setPlayerCount(6);

    assert.equal(
        revisedMapString,
        "{0} 85A3 59 85A5 69 85A1 68 63 87A3 30 88A5 45 87A5 66 87A3 79 88A5 26 88A3 86A3 84A3 39 0 64 83A2 86A5 84A5 67 0 25 84A3 86A1 83A2 80 0 32 83A0"
    );
});
