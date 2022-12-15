require("../../global"); // register world.TI4
const assert = require("assert");
const updatorActiveSystem = require("./updator-active-system");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
} = require("../../wrapper/api");

it("updator-active-system", () => {
    const mecatolObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const player = new MockPlayer();
    globalEvents.TI4.onSystemActivated.trigger(mecatolObj, player);

    const data = {};
    updatorActiveSystem(data);
    assert.deepEqual(data, {
        activeSystem: { tile: 18, planets: ["Mecatol Rex"] },
    });
});
