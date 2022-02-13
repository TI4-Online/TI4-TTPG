const assert = require("assert");
const { AdjacencyWormhole } = require("./adjacency-wormhole");
const { Hex } = require("../hex");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    world,
} = require("../../wrapper/api");

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
    const beta40 = new MockGameObject({
        templateMetadata: "tile.system:base/40",
        position: Hex.toPosition("<3,0,-3>"),
    });
    world.__addObject(alpha26);
    world.__addObject(alpha39);
    world.__addObject(beta40);
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});

it("token wormholes", () => {
    world.__clear();
    const gamma1 = new MockGameObject({
        templateMetadata: "token.wormhole.exploration:pok/gamma",
        position: Hex.toPosition("<1,0,-1>"),
    });
    const gamma2 = new MockGameObject({
        templateMetadata: "token.wormhole.creuss:pok/gamma",
        position: Hex.toPosition("<2,0,-2>"),
    });
    world.__addObject(gamma1);
    world.__addObject(gamma2);
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});

it("wormhole_reconstruction", () => {
    world.__clear();
    const alpha26 = new MockGameObject({
        templateMetadata: "tile.system:base/26",
        position: Hex.toPosition("<1,0,-1>"),
    });
    const alpha39 = new MockGameObject({
        templateMetadata: "tile.system:base/39",
        position: Hex.toPosition("<2,0,-2>"),
    });
    const beta40 = new MockGameObject({
        templateMetadata: "tile.system:base/40",
        position: Hex.toPosition("<3,0,-3>"),
    });
    const wormholeReconstruction = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.agenda:base/wormhole_reconstruction",
        }),
        faceUp: true,
    });
    world.__addObject(alpha26);
    world.__addObject(alpha39);
    world.__addObject(beta40);
    world.__addObject(wormholeReconstruction);
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, ["<2,0,-2>", "<3,0,-3>"]);
});
