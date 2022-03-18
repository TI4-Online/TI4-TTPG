require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-command-tokens");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("player.commandTokens", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const slot = playerDesks[0].playerSlot;
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            owningPlayerSlot: slot,
            position: new MockVector(0, 0, 0),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            owningPlayerSlot: slot,
            position: new MockVector(10, 0, 0),
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].commandTokens.tactics, 1);
});
