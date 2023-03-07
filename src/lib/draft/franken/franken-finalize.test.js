require("../../../global"); // register world.TI4
const assert = require("assert");
const { FrankenFinalize } = require("./franken-finalize");
const { MockGameObject, world } = require("../../../wrapper/api");

it("_setTurnOrder", () => {
    world.__clear();

    // Get a list of desks, move front to back.
    const desks = [...world.TI4.getAllPlayerDesks()];
    const move = desks.shift();
    desks.push(move);

    desks.forEach((desk, index) => {
        const json = JSON.stringify({ franken: true, turnOrder: index });
        world.__addObject(
            new MockGameObject({
                position: desk.pos,
                templateMetadata: "tile:homebrew/name_desc",
                savedData: json,
            })
        );
    });

    FrankenFinalize.setTurnOrder();
    world.__clear();

    const expectedOrder = desks.map((desk) => desk.index);
    const observedOrder = world.TI4.turns
        .getTurnOrder()
        .map((desk) => desk.index);
    assert.deepEqual(observedOrder, expectedOrder);
});
