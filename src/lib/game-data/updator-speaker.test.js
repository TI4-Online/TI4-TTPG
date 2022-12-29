require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-speaker");
const { MockGameObject, world } = require("../../wrapper/api");

it("round", () => {
    const data = {};

    const desk = world.TI4.getAllPlayerDesks()[0];

    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/speaker",
            position: desk.center,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.equal(data.speaker, "White");
});
