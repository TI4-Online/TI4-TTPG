require("../../../global");
const assert = require("assert");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const MapStringParser = require("../../map-string/map-string-parser");
const { SLICE_SHAPES } = require("./abstract-slice-generator");

it("_defaultLayoutTile (blue)", () => {
    const anchorHex = "<-3,0,3>"; // blue
    const dirHex = "<0,0,0>";
    const shapeHex = "<1,0,-1>"; // north
    const tile = 1;
    const mapStringArray = [];

    const hex = AbstractSliceLayout._defaultLayoutTile(
        anchorHex,
        dirHex,
        shapeHex,
        tile,
        mapStringArray
    );

    assert.equal(hex, "<-2,0,2>");
});

it("_defaultLayoutTile (white)", () => {
    const anchorHex = "<-3,3,0>"; // blue
    const dirHex = "<0,0,0>";
    const shapeHex = "<1,0,-1>"; // north
    const tile = 1;
    const mapStringArray = [];

    const hex = AbstractSliceLayout._defaultLayoutTile(
        anchorHex,
        dirHex,
        shapeHex,
        tile,
        mapStringArray
    );

    assert.equal(hex, "<-2,2,0>");
});

it("_defaultLayoutTile (yellow)", () => {
    const anchorHex = "<3,-3,0>"; // blue
    const dirHex = "<0,0,0>";
    const shapeHex = "<1,0,-1>"; // north
    const tile = 1;
    const mapStringArray = [];

    const hex = AbstractSliceLayout._defaultLayoutTile(
        anchorHex,
        dirHex,
        shapeHex,
        tile,
        mapStringArray
    );

    assert.equal(hex, "<2,-2,0>");
});

it("_defaultLayoutSlice (blue)", () => {
    const deskIndex = 1; // blue, points up
    const abstractSliceLayout = new AbstractSliceLayout()
        .setShape(SLICE_SHAPES.milty)
        .setSlice(deskIndex, [21, 22, 23, 24, 25]);

    const mapStringArray = [];
    abstractSliceLayout._defaultLayoutSlice(deskIndex, mapStringArray);
    const mapString = MapStringParser.format(mapStringArray);

    assert.equal(
        mapString,
        "{-1} -1 -1 -1 25 -1 -1 -1 -1 -1 -1 -1 -1 22 24 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 23 0 21"
    );
});

it("_defaultLayoutSlice (white)", () => {
    const deskIndex = 0; // white, points northwest
    const abstractSliceLayout = new AbstractSliceLayout()
        .setShape(SLICE_SHAPES.milty)
        .setSlice(deskIndex, [21, 22, 23, 24, 25]);

    const mapStringArray = [];
    abstractSliceLayout._defaultLayoutSlice(deskIndex, mapStringArray);
    const mapString = MapStringParser.format(mapStringArray);

    assert.equal(
        mapString,
        "{-1} -1 -1 25 -1 -1 -1 -1 -1 -1 -1 22 24 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 23 0 21"
    );
});

it("setOverrideShape", () => {
    const deskIndex = 0; // white, points northwest
    const abstractSliceLayout = new AbstractSliceLayout()
        .setShape(SLICE_SHAPES.milty)
        .setOverrideShape(deskIndex, [
            "<0,0,0>", // straight line pointing north
            "<1,0,-1>",
            "<2,0,-2>",
            "<3,0,-3>",
            "<4,0,-4>",
            "<5,0,-5>",
        ])
        .setSlice(deskIndex, [21, 22, 23, 24, 25]);

    const mapStringArray = [];
    abstractSliceLayout._defaultLayoutSlice(deskIndex, mapStringArray);
    const mapString = MapStringParser.format(mapStringArray);

    assert.equal(
        mapString,
        "{23} -1 -1 22 -1 -1 24 -1 -1 -1 -1 21 -1 -1 -1 -1 -1 25 -1 -1 -1 -1 -1 -1 -1 0"
    );
});

it("setAnchorTile", () => {
    const deskIndex = 0; // white, points northwest
    const abstractSliceLayout = new AbstractSliceLayout()
        .setShape(SLICE_SHAPES.milty)
        .setSlice(deskIndex, [21, 22, 23, 24, 25])
        .setAnchorTile(deskIndex, 777);

    const mapStringArray = [];
    abstractSliceLayout._defaultLayoutSlice(deskIndex, mapStringArray);
    const mapString = MapStringParser.format(mapStringArray);

    assert.equal(
        mapString,
        "{-1} -1 -1 25 -1 -1 -1 -1 -1 -1 -1 22 24 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 23 777 21"
    );
});
