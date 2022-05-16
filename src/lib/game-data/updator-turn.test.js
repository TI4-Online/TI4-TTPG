require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-turn");
const { world } = require("../../wrapper/api");

it("turn", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };
    UPDATOR(data);

    let actual = world.TI4.turns.getCurrentTurn().colorName;
    actual = actual.charAt(0).toUpperCase() + actual.slice(1);

    assert(actual, data.turnActual);
});
