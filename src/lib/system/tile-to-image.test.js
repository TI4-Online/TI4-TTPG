require("../../global"); // register world.TI4
const assert = require("assert");
const { TileToImage, TILE_TO_IMAGE } = require("./tile-to-image");

it("TileToImage", () => {
    for (const [tileStr, image] of Object.entries(TILE_TO_IMAGE)) {
        const tile = Number.parseInt(tileStr);
        const r = TileToImage.tileToImage(tile);
        assert.equal(r, image);
    }
});
