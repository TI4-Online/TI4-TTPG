require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-color");
const { world } = require("../../wrapper/api");

it("player.steamName", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return {};
        }),
    };

    world.__clear();
    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].color, "White");
    assert.equal(data.players[0].actualColor, "White");
});
