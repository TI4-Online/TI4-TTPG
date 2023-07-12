require("../../../global");
const assert = require("assert");
const { UiMap } = require("./ui-map");
const { world } = require("../../../wrapper/api");

it("deskIndexToColorTile", () => {
    for (const isHome of [false, true]) {
        for (
            let deskIndex = 0;
            deskIndex < world.TI4.config.playerCount;
            deskIndex++
        ) {
            const tile = UiMap.deskIndexToColorTile(deskIndex, isHome);
            const reverse = UiMap.tileToDeskIndexAndIsHome(tile);
            assert.equal(reverse.deskIndex, deskIndex);
            assert.equal(reverse.isHome, isHome);
        }
    }
});
