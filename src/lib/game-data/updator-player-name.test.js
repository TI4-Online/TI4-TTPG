require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-name");
const { world } = require("../../wrapper/api");

it("player.steamName", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].steamName, "-");
});
