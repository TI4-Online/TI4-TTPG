const assert = require("assert");
const { Hyperlane } = require("./hyperlane");

it("getMapString", () => {
    const mapString = Hyperlane.getMapString(3);
    assert(mapString);
});
