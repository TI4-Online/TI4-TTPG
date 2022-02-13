const assert = require("assert");
const { AdjacencyNeighbor } = require("./adjacency-neighbor");

it("adjacency", () => {
    const hex = "<0,0,0>";
    const adjSet = new AdjacencyNeighbor(hex).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, [
        "<-1,0,1>",
        "<-1,1,0>",
        "<0,-1,1>",
        "<0,1,-1>",
        "<1,-1,0>",
        "<1,0,-1>",
    ]);
});
