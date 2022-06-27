require("../global"); // register world.TI4
const assert = require("assert");
const { GlobalSavedData } = require("./saved-data/global-saved-data");
const { PlayerDesk } = require("./player-desk/player-desk");
const { Turns, TURN_ORDER_TYPE } = require("./turns");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../wrapper/api");

it("constructor", () => {
    new Turns();
});

it("get/set turn order", () => {
    const numbers = [...Array(5).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();
    const masterIndexOrder = playerDesks.map((desk) => desk.index);

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    const order = turns.getTurnOrder();
    const indexOrder = order.map((desk) => desk.index);
    assert.deepEqual(indexOrder, masterIndexOrder);
});

it("get/set current turn", () => {
    const playerDesk = PlayerDesk.createDummy(0, 0);
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setCurrentTurn(playerDesk, clickingPlayer);
    const current = turns.getCurrentTurn();
    assert.equal(current, playerDesk);
});

it("end turn", () => {
    const numbers = [...Array(5).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
});

it("passed turn (self)", () => {
    const mockStatusPad = new MockGameObject({
        templateMetadta: "pad:base/status",
        owningPlayerSlot: 0,
    });
    mockStatusPad.__getPass = () => {
        return true;
    };

    world.__clear();
    world.__addObject(mockStatusPad);

    const numbers = [...Array(5).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    turns.endTurn(clickingPlayer); // current player (0) passed
    assert(turns.getCurrentTurn(), playerDesks[1]);

    world.__clear();
});

it("passed turn (next)", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const clickingPlayer = new MockPlayer();

    const mockStatusPad = new MockGameObject({
        templateMetadata: "pad:base/status",
        owningPlayerSlot: playerDesks[1].playerSlot,
    });
    mockStatusPad.__getPass = () => {
        return true;
    };

    world.__clear();
    world.__addObject(mockStatusPad);

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    assert.equal(turns.getCurrentTurn().index, 0);
    turns.endTurn(clickingPlayer); // player 1 passed!
    assert.equal(turns.getCurrentTurn().index, 2);

    world.__clear();
});

it("onTurnOrderEmpty", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const clickingPlayer = new MockPlayer();

    let triggerCount = 0;
    const listener = () => {
        triggerCount += 1;
    };
    globalEvents.TI4.onTurnOrderEmpty.add(listener);

    world.__clear();
    for (const playerDesk of playerDesks) {
        const mockStatusPad = new MockGameObject({
            templateMetadata: "pad:base/status",
            owningPlayerSlot: playerDesk.playerSlot,
        });
        mockStatusPad.__getPass = () => {
            return true;
        };
        world.__addObject(mockStatusPad);
    }
    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    turns.endTurn(clickingPlayer); // all players passed!

    globalEvents.TI4.onTurnOrderEmpty.remove(listener);
    world.__clear();

    assert.equal(triggerCount, 1);
});

it("persistence", () => {
    GlobalSavedData.clear();

    // Need to use world.TI4 objects for persist loading.
    const playerDesks = world.TI4.getAllPlayerDesks();
    const currentTurnDesk = playerDesks[2];
    const clickingPlayer = new MockPlayer();
    const masterIndexOrder = playerDesks.map((desk) => desk.index);

    const turns1 = new Turns(true);
    turns1.setTurnOrder(playerDesks, clickingPlayer);
    turns1.setCurrentTurn(currentTurnDesk, clickingPlayer);
    const indexOrder1 = turns1.getTurnOrder().map((desk) => desk.index);
    assert.deepEqual(indexOrder1, masterIndexOrder);
    //assert.equal(turns1.getCurrentTurn(), currentTurnDesk);

    const turns2 = new Turns(true);
    const indexOrder2 = turns2.getTurnOrder().map((desk) => desk.index);
    assert.deepEqual(indexOrder2, masterIndexOrder);
    //assert.equal(turns2.getCurrentTurn(), currentTurnDesk);

    GlobalSavedData.clear();
});

it("forward", () => {
    const numbers = [...Array(3).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer, TURN_ORDER_TYPE.FORWARD);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    assert(turns.getNextTurn(), playerDesks[1]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[2]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[2]);
    assert(turns.getNextTurn(), playerDesks[0]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    assert(turns.getNextTurn(), playerDesks[1]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[2]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[2]);
    assert(turns.getNextTurn(), playerDesks[0]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    assert(turns.getNextTurn(), playerDesks[1]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[2]);
});

it("snake", () => {
    const numbers = [...Array(3).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer, TURN_ORDER_TYPE.SNAKE);
    turns.setCurrentTurn(playerDesks[0], clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[2]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[2]);
    assert(turns.getNextTurn(), playerDesks[2]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[2]);
    assert(turns.getNextTurn(), playerDesks[1]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[0]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    assert(turns.getNextTurn(), playerDesks[0]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[0]);
    assert(turns.getNextTurn(), playerDesks[1]);

    turns.endTurn(clickingPlayer);
    assert(turns.getCurrentTurn(), playerDesks[1]);
    assert(turns.getNextTurn(), playerDesks[2]);
});

it("getAllStatusPads", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();

    const mockStatusPad = new MockGameObject({
        templateMetadata: "pad:base/status",
        owningPlayerSlot: playerDesks[1].playerSlot,
    });
    mockStatusPad.__getPass = () => {
        return true;
    };

    world.__clear();
    world.__addObject(mockStatusPad);

    const all = world.TI4.turns.getAllStatusPads();
    world.__clear();

    assert.equal(all.length, 1);
    assert.equal(all[0], mockStatusPad);
});

it("getAllStatusPad", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();

    const mockStatusPad = new MockGameObject({
        templateMetadata: "pad:base/status",
        owningPlayerSlot: playerDesks[1].playerSlot,
    });
    mockStatusPad.__getPass = () => {
        return true;
    };

    world.__clear();
    world.__addObject(mockStatusPad);

    const padNo = world.TI4.turns.getStatusPad(-1);
    const padYes = world.TI4.turns.getStatusPad(playerDesks[1].playerSlot);
    world.__clear();

    assert.equal(padNo, undefined);
    assert.equal(padYes, mockStatusPad);
});
