require("../../../global");
const assert = require("assert");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { Hyperlane } = require("../../map-string/hyperlane");
const { SLICE_SHAPES } = require("./abstract-slice-generator");
const { MockPlayer, world } = require("../../../wrapper/api");

it("5p", () => {
    const player = new MockPlayer();
    const origPlayerCount = world.TI4.config.playerCount;
    world.TI4.config.setPlayerCount(5, player);

    const shape = SLICE_SHAPES.milty;

    const abstractSliceLayout = new AbstractSliceLayout().setShape(shape);
    for (
        let deskIndex = 0;
        deskIndex < world.TI4.config.playerCount;
        deskIndex++
    ) {
        const tile = deskIndex + 1;
        const slice = [tile, tile, tile, tile, tile];
        abstractSliceLayout.setSlice(deskIndex, slice);
    }
    const slicesMapString = abstractSliceLayout.generateMapString();

    const hyperlanesMapString = Hyperlane.getMapString(
        world.TI4.config.playerCount
    );

    const mapString = new AbstractPlaceHyperlanes().placeHyperlanes(
        slicesMapString,
        hyperlanesMapString
    );

    world.TI4.config.setPlayerCount(origPlayerCount, player);

    assert.equal(
        mapString,
        "{-1} 4 5 1 85A0 2 3 4 4 5 5 1 88A0 1 87A0 2 2 3 3 0 4 5 0 5 1 0 1 83A0 86A0 84A3 2 0 2 3 0 3 4"
    );
});

it("7p", () => {
    const player = new MockPlayer();
    const origPlayerCount = world.TI4.config.playerCount;
    world.TI4.config.setPlayerCount(7, player);

    const shape = SLICE_SHAPES.milty;

    const abstractSliceLayout = new AbstractSliceLayout().setShape(shape);
    for (
        let deskIndex = 0;
        deskIndex < world.TI4.config.playerCount;
        deskIndex++
    ) {
        const tile = deskIndex + 20;
        const slice = [tile, tile, tile, tile, tile];
        abstractSliceLayout.setSlice(deskIndex, slice);
    }
    //abstractSliceLayout.setHexDirection(0, "<1,-1,0>");
    //abstractSliceLayout.setHexDirection(2, "<0,1,-1>");
    //abstractSliceLayout.setHexDirection(3, "<0,1,-1>");
    //abstractSliceLayout.setHexDirection(4, "<0,1,-1>");
    //abstractSliceLayout.setHexDirection(5, "<0,1,-1>");
    //abstractSliceLayout.setHexDirection(6, "<0,1,-1>");

    abstractSliceLayout.setOverrideShape(3, SLICE_SHAPES.milty_7p_seat3);

    // Use the rulebook funky shape
    const HEX = {
        N: { onMap: "<3,0,-3>", offMap: "<5,0,-5>" },
        NE: { onMap: "<0,3,-3>", offMap: "<2,3,-5>" },
        SE: { onMap: "<-3,3,0>", offMap: "<-5,3,2>" },
        S: { onMap: "<-3,0,3>", offMap: "<-5,0,5>" },
        SW: { onMap: "<0,-3,3>", offMap: "<-2,-3,5>" },
        NW: { onMap: "<3,-3,0>", offMap: "<5,-3,-2>" },
    };
    const anchorHexes = [
        // this is the rulebook funky shape
        HEX.SE,
        { onMap: "<-4,0,4>", offMap: "<-6,0,6>" }, // red
        { onMap: "<-1,-3,4>", offMap: "<-3,-3,6>" },
        { onMap: "<2,-4,2>", offMap: "<4,-5,1>" }, // pink
        { onMap: "<4,-3,-1>", offMap: "<6,-3,-3>" }, // yellow
        { onMap: "<4,0,-4>", offMap: "<6,0,-6>" }, // blue
        HEX.NE,
    ];
    anchorHexes.forEach((anchorHex, deskIndex) => {
        abstractSliceLayout.setAnchorHex(deskIndex, anchorHex.onMap);
    });

    const slicesMapString = abstractSliceLayout.generateMapString();

    const hyperlanesMapString =
        "{-1} 85B3 -1 -1 84B3 90B0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 88B3 -1 -1 -1 -1 -1 -1 86B3 -1 -1 -1 -1 -1 83B2";

    const mapString = new AbstractPlaceHyperlanes().placeHyperlanes(
        slicesMapString,
        hyperlanesMapString
    );

    world.TI4.config.setPlayerCount(origPlayerCount, player);

    assert.equal(
        mapString,
        "{-1} 85B3 26 20 84B3 90B0 23 25 25 26 26 20 20 21 22 22 23 23 24 25 88B3 26 0 26 20 0 20 86B3 21 21 22 22 23 83B2 24 24 24 0 25 -1 -1 -1 -1 -1 -1 -1 -1 -1 21 0 21 22 0 -1 -1 0 23 -1 0 24 25"
    );
});
