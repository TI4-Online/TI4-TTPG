const assert = require("assert");
const { AdjacencyWormhole } = require("./adjacency-wormhole");
const { Hex } = require("../hex");
const { MockGameObject, world } = require("../../wrapper/api");

it("none", () => {
    const hex = "<0,0,0>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, []);
});

it("system tile wormholes", () => {
    world.__clear();
    const alpha26 = new MockGameObject({
        templateMetadata: "tile.system:base/26",
        position: Hex.toPosition("<1,0,-1>"),
    });
    const alpha39 = new MockGameObject({
        templateMetadata: "tile.system:base/39",
        position: Hex.toPosition("<2,0,-2>"),
    });
    world.__addObject(alpha26);
    world.__addObject(alpha39);
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});
