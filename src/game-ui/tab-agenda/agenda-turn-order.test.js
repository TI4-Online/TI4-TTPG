require("../../global"); // create world.TI4
const assert = require("assert");
const { AgendaTurnOrder, REVERSE_ORDER_NSID } = require("./agenda-turn-order");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

it("findSpeakerToken", () => {
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
    });
    world.__clear();
    world.__addObject(speakerToken);
    const found = AgendaTurnOrder.findSpeakerToken();
    world.__clear();
    assert.equal(found, speakerToken);
});

it("getSpeakerPlayerDesk", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: playerDesk.center,
    });
    world.__clear();
    world.__addObject(speakerToken);
    const found = AgendaTurnOrder.getSpeakerPlayerDesk();
    world.__clear();
    assert.equal(found, playerDesk);
});

it("getResolveOrder", () => {
    world.TI4.config.setPlayerCount(6);
    const playerDesk = world.TI4.getAllPlayerDesks()[1]; // ONE!
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: playerDesk.center,
    });
    world.__clear();
    world.__addObject(speakerToken);
    const order = AgendaTurnOrder.getResolveOrder().map((desk) => desk.index);
    world.__clear();
    assert.deepEqual(order, [1, 2, 3, 4, 5, 0]);
});

it("getVoteOrder", () => {
    world.TI4.config.setPlayerCount(6);
    const playerDesk = world.TI4.getAllPlayerDesks()[1]; // ONE!
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: playerDesk.center,
    });
    world.__clear();
    world.__addObject(speakerToken);
    const order = AgendaTurnOrder.getVoteOrder().map((desk) => desk.index);
    world.__clear();
    assert.deepEqual(order, [2, 3, 4, 5, 0, 1]);
});

it("getVoteOrder reversed", () => {
    world.TI4.config.setPlayerCount(6);
    const speakerDesk = world.TI4.getAllPlayerDesks()[1]; // ONE!
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: speakerDesk.center,
    });
    const reverse = new MockGameObject({
        templateMetadata: REVERSE_ORDER_NSID,
    });
    world.__clear();
    world.__addObject(speakerToken);
    world.__addObject(reverse);
    const order = AgendaTurnOrder.getVoteOrder().map((desk) => desk.index);
    world.__clear();
    assert.deepEqual(order, [0, 5, 4, 3, 2, 1]);
});

it("getVoteOrder w/ zeal (votes first)", () => {
    world.TI4.config.setPlayerCount(6);
    const speakerDesk = world.TI4.getAllPlayerDesks()[1]; // ONE!
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: speakerDesk.center,
    });
    const zealDesk = world.TI4.getAllPlayerDesks()[3];
    const zealFactionSheet = new MockGameObject({
        templateMetadata: "sheet.faction:pok/argent",
        position: zealDesk.center,
    });
    world.__clear();
    world.__addObject(speakerToken);
    world.__addObject(zealFactionSheet);

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(zealDesk.playerSlot, player);

    const order = AgendaTurnOrder.getVoteOrder().map((desk) => desk.index);
    world.__clear();
    assert.deepEqual(order, [3, 2, 4, 5, 0, 1]);
});
