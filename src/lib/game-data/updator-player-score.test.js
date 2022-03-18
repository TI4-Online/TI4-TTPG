require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-score");
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
            templateMetadata: "token:base/scoreboard",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.control:base/arborec",
            owningPlayerSlot: playerDesks[0].playerSlot,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].score, 5);
    assert.equal(data.players[1].score, 0);
});
