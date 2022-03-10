require("../../global"); // register world.TI4
const assert = require("assert");
const { TileToImage } = require("./tile-to-image");

it("TileToImage", () => {
    const path = TileToImage.tileToImage(1);
    assert(path);
});
