require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { Adjacency } = require("./adjacency");
const { Hex } = require("../hex");
const { MockGameObject, world } = require("../../wrapper/api");

it("getAdjacent", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/26", // alpha
            position: Hex.toPosition("<0,0,0>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/39", // alpha
            position: Hex.toPosition("<2,0,-2>"),
        })
    );
    const hex = "<0,0,0>";
    const playerSlot = -1;
    const adjList = Adjacency.getAdjacent(hex, playerSlot).sort();
    world.__clear();
    assert.deepEqual(adjList, [
        "<-1,0,1>",
        "<-1,1,0>",
        "<0,-1,1>",
        "<0,1,-1>",
        "<1,-1,0>",
        "<1,0,-1>",
        "<2,0,-2>",
    ]);
});
