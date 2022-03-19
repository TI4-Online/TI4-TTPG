require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-active");
const { MockGameObject, world } = require("../../wrapper/api");

it("player.active", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const mockStatusPad = new MockGameObject({
        templateMetadata: "pad:base/status",
        owningPlayerSlot: playerDesks[0].playerSlot,
    });
    mockStatusPad.__getPass = () => {
        return true;
    };

    world.__clear();
    world.__addObject(mockStatusPad);
    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].active, false);
    assert.equal(data.players[1].active, true);
});
