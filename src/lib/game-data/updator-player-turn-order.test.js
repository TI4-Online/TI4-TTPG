require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-turn-order");
const { MockGameObject, world } = require("../../wrapper/api");

it("order", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    assert(playerDesks.length > 2);
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
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

    UPDATOR(data);
    world.__clear();

    const turnOrderValues = data.players.map(
        (playerData) => playerData.turnOrder
    );

    assert.equal(turnOrderValues[2], 0); // zero token
    assert.equal(turnOrderValues[0], 1); // diplomacy
    assert.equal(turnOrderValues[1], 2); // trade
});
