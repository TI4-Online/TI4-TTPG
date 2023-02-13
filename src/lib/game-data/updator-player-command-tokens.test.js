require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-command-tokens");
const { MockGameObject, world } = require("../../wrapper/api");

it("player.commandTokens", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const playerDesk = playerDesks[0];
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            position: playerDesk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            position: playerDesk.center.add([8, 0, 0]),
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].commandTokens.tactics, 1);
});
