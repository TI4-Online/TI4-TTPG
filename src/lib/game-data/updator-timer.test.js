require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-timer");
const { MockGameObject, world } = require("../../wrapper/api");

it("player.tgs", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const timer = new MockGameObject({
        templateMetadata: "tool:base/timer",
    });
    timer.__timer = {
        getValue: () => {
            return 1;
        },
        getAnchorTimestamp: () => {
            return 2;
        },
        getAnchorValue: () => {
            return 3;
        },
        getDirection: () => {
            return -1;
        },
        getCountdownFrom: () => {
            return 3600;
        },
    };

    world.__clear();

    world.__addObject(timer);
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.timer, {
        anchorSeconds: 3,
        anchorTimestamp: 2,
        direction: -1,
        seconds: 1,
        countDown: 3600,
    });
});
