require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { FindTurnOrder } = require("./find-turn-order");
const { MockGameObject, world } = require("../../wrapper/api");

it("order", () => {
    world.__clear();
    const playerDesks = world.TI4.getAllPlayerDesks();
    assert(playerDesks.length > 2);
    world.__addObject(
        new MockGameObject({
            position: playerDesks[0].pos,
            templateMetadata: "tile.strategy:base/diplomacy.errata",
        })
    );
    world.__addObject(
        new MockGameObject({
            position: playerDesks[0].pos,
            templateMetadata: "tile.strategy:base/imperial",
        })
    );
    world.__addObject(
        new MockGameObject({
            position: playerDesks[1].pos,
            templateMetadata: "tile.strategy:base/trade",
        })
    );
    world.__addObject(
        new MockGameObject({
            position: playerDesks[1].pos,
            templateMetadata: "tile.strategy:base/technology",
        })
    );
    world.__addObject(
        new MockGameObject({
            position: playerDesks[2].pos,
            templateMetadata: "token.naalu:base/zero",
        })
    );
    const order = FindTurnOrder.order();
    world.__clear();
    assert.equal(order[0], playerDesks[2]); // zero token
    assert.equal(order[1], playerDesks[0]); // diplomacy
    assert.equal(order[2], playerDesks[1]); // trade
});
