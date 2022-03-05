require("../global"); // register world.TI4
const assert = require("assert");
const { PlayerDesk } = require("./player-desk/player-desk");
const { Turns } = require("./turns");
const { MockGameObject, MockPlayer, world } = require("../wrapper/api");

it("constructor", () => {
    new Turns();
});

it("get/set turn order", () => {
    const numbers = [...Array(5).keys()];
    const playerDesks = numbers.map((i) => PlayerDesk.createDummy(i, i));
    const clickingPlayer = new MockPlayer();

    const turns = new Turns();
    turns.setTurnOrder(playerDesks, clickingPlayer);
    const order = turns.getTurnOrder();
    assert.deepEqual(order, playerDesks);
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
    const mockStatusPad = new MockGameObject({
        templateMetadta: "pad:base/status",
        owningPlayerSlot: 1,
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
    turns.endTurn(clickingPlayer); // player 1 passed!
    assert(turns.getCurrentTurn(), playerDesks[2]);

    world.__clear();
});
