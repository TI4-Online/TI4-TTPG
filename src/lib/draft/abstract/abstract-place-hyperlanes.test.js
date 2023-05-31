require("../../../global"); // register world.TI4
const assert = require("assert");
const { Hyperlane } = require("../../map-string/hyperlane");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");

it("_moveCollisions", () => {
    const hyperlanesMapString = Hyperlane.getMapString(4);
    assert.equal(
        hyperlanesMapString,
        "{-1} 85A3 -1 -1 85A0 -1 -1 -1 88A1 -1 -1 -1 88A0 -1 87A0 -1 -1 -1 87A5 86A3 83A1 -1 -1 -1 -1 -1 -1 83A0 86A0 84A3 -1 -1 -1 -1 -1 -1 84A5"
    );

    let mapString, merged;

    // System is alredy in the hyperlane spot.
    mapString =
        "-1 23 68 -1 46 41 31 -1 76 48 40 -1 65 -1 34 64 38 -1 -1 -1 42 0 79 21 0 32 -1 -1 -1 39 0 71 24 0 63";
    merged = AbstractPlaceHyperlanes._moveCollisions(
        mapString,
        hyperlanesMapString
    );
    assert.equal(
        merged,
        "85A3 23 68 85A0 46 41 31 88A1 76 48 40 88A0 65 87A0 34 64 38 87A5 86A3 83A1 42 0 79 21 0 32 83A0 86A0 84A3 39 0 71 24 0 63 84A5"
    );

    // Left-eq spot.
    mapString =
        "-1 23 68 -1 46 41 -1 31 76 48 40 -1 -1 65 34 64 38 -1 -1 -1 42 0 79 21 0 32 -1 -1 -1 39 0 71 24 0 63";
    merged = AbstractPlaceHyperlanes._moveCollisions(
        mapString,
        hyperlanesMapString
    );
    assert.equal(
        merged,
        "85A3 23 68 85A0 46 41 31 88A1 76 48 40 88A0 65 87A0 34 64 38 87A5 86A3 83A1 42 0 79 21 0 32 83A0 86A0 84A3 39 0 71 24 0 63 84A5"
    );

    // Right-eq spot.
    mapString =
        "-1 23 68 -1 46 41 -1 -1 76 48 40 65 -1 -1 34 64 38 31 -1 -1 42 0 79 21 0 32 -1 -1 -1 39 0 71 24 0 63";
    merged = AbstractPlaceHyperlanes._moveCollisions(
        mapString,
        hyperlanesMapString
    );
    assert.equal(
        merged,
        "85A3 23 68 85A0 46 41 31 88A1 76 48 40 88A0 65 87A0 34 64 38 87A5 86A3 83A1 42 0 79 21 0 32 83A0 86A0 84A3 39 0 71 24 0 63 84A5"
    );
});
