require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-tgs");
const { MockGameObject, MockRotator, world } = require("../../wrapper/api");

it("player.tgs", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/tradegood_commodity_1",
            position: playerDesks[0].center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/tradegood_commodity_3",
            position: playerDesks[0].center,
            rotation: new MockRotator(0, 0, 180),
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].commodities, 1);
    assert.equal(data.players[0].tradeGoods, 3);
});
