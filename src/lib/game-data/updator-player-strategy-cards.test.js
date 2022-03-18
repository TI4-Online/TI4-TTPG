require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-strategy-cards");
const { MockGameObject, world } = require("../../wrapper/api");

it("player.score", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.strategy:base/leadership",
            position: playerDesks[0].center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.strategy:base/diplomacy",
            position: playerDesks[0].center,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].strategyCards.length, 2);
    assert(data.players[0].strategyCards.includes("Leadership"));
    assert(data.players[0].strategyCards.includes("Diplomacy"));
});
