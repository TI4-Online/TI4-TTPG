require("../../../global"); // register world.TI4
const assert = require("assert");
const { BunkerSliceLayout } = require("./bunker-slice-layout");
const { Hex } = require("../../hex");

it("_getAnchorPosition", () => {
    let deskIndex = 0;
    let playerCount = 6;
    let anchor = BunkerSliceLayout._getAnchorPosition(deskIndex, playerCount);
    let hex = Hex.fromPosition(anchor);
    assert.equal(hex, "<-2,3,-1>");

    deskIndex = 1;
    playerCount = 6;
    anchor = BunkerSliceLayout._getAnchorPosition(deskIndex, playerCount);
    hex = Hex.fromPosition(anchor);
    assert.equal(hex, "<-3,1,2>");

    deskIndex = 0;
    playerCount = 5;
    anchor = BunkerSliceLayout._getAnchorPosition(deskIndex, playerCount);
    hex = Hex.fromPosition(anchor);
    assert.equal(hex, "<-2,3,-1>");

    deskIndex = 1;
    playerCount = 5;
    anchor = BunkerSliceLayout._getAnchorPosition(deskIndex, playerCount);
    hex = Hex.fromPosition(anchor);
    assert.equal(hex, "<-1,-2,3>");
});

it("getTilePositions", () => {
    let deskIndex = 1; // findLookAtRotation returns zero in mock, use a matching slot
    let playerCount = 6;
    let anchor = BunkerSliceLayout._getAnchorPosition(deskIndex, playerCount);
    let posArray = BunkerSliceLayout._getTilePositions(anchor);
    let hexes = posArray.map((pos) => Hex.fromPosition(pos));
    assert.deepEqual(hexes, [
        "<-3,1,2>", // home
        "<-3,0,3>",
        "<-2,0,2>",
        "<-2,1,1>",
        "<-3,2,1>",
    ]);
});

it("toMapString", () => {
    const bunker = [19, 20, 30, 40];
    let deskIndex = 1;
    let playerCount = 6;
    let str = BunkerSliceLayout._toMapString(bunker, deskIndex, playerCount);
    assert.equal(
        str,
        "{-1} -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 30 20 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 40 0 19"
    );
});

it("addHyperlanes", () => {
    const mapString = "";
    const playerCount = 5;
    const str = BunkerSliceLayout._addHyperlanes(mapString, playerCount);
    assert.equal(
        str,
        "-1 -1 -1 89B1 -1 -1 -1 -1 -1 -1 -1 83A0 83A0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 87B4 83A0 86A0"
    );
});
