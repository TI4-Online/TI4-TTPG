require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { AdjacencyWormhole } = require("./adjacency-wormhole");
const { Hex } = require("../hex");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Faction } = require("../faction/faction");

it("none", () => {
    const hex = "<0,0,0>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    assert.deepEqual(adjList, []);
});

it("system tile wormholes", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/26", // alpha
            position: Hex.toPosition("<1,0,-1>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/39", // alpha
            position: Hex.toPosition("<2,0,-2>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/40", // beta
            position: Hex.toPosition("<3,0,-3>"),
        })
    );
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    world.__clear();
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});

it("token wormholes", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.wormhole.exploration:pok/gamma",
            position: Hex.toPosition("<1,0,-1>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.wormhole.creuss:pok/gamma",
            position: Hex.toPosition("<2,0,-2>"),
        })
    );
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    world.__clear();
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});

it("flagship wormholes", () => {
    world.__clear();
    const desk = world.TI4.getAllPlayerDesks()[0];
    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet.faction:base/creuss",
            position: desk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/17", // delta
            position: Hex.toPosition("<1,0,-1>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/flagship",
            position: Hex.toPosition("<2,0,-2>"),
            owningPlayerSlot: desk.playerSlot,
        })
    );

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desk.playerSlot, player);

    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    world.__clear();
    assert.equal(
        Faction.getByPlayerSlot(desk.playerSlot).raw.faction,
        "creuss"
    );
    assert.deepEqual(adjList, ["<2,0,-2>"]);
});

it("wormhole_reconstruction", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/26", // alpha
            position: Hex.toPosition("<1,0,-1>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/39", // alpha
            position: Hex.toPosition("<2,0,-2>"),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/40", // beta
            position: Hex.toPosition("<3,0,-3>"),
        })
    );
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.agenda:base/wormhole_reconstruction",
            }),
            faceUp: true,
        })
    );
    const hex = "<1,0,-1>";
    const playerSlot = -1;
    const adjSet = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
    const adjList = [...adjSet].sort();
    world.__clear();
    assert.deepEqual(adjList, ["<2,0,-2>", "<3,0,-3>"]);
});
