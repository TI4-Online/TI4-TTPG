require("../../global"); // register world.TI4
const assert = require("assert");
const updator = require("./updator-map-string");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("mapString", () => {
    world.TI4.reset();
    let data = {};
    updator(data);
    assert.equal(data.mapString, "");

    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/19",
            position: new MockVector(0, 0, 0),
        })
    );
    updator(data);
    world.__clear();

    assert.equal(data.mapString, "{19}");
});
