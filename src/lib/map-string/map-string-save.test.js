require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { Hex } = require("../hex");
const { MapStringSave } = require("./map-string-save");
const {
    MockGameObject,
    MockRotator,
    MockVector,
    world,
} = require("../../wrapper/api");

it("empty save", () => {
    world.__clear();
    const mapString = MapStringSave.save();
    assert.equal(mapString, "");
});

it("mecatol-only save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/18",
            position: new MockVector(0, 0, 0),
        })
    );
    const mapString = MapStringSave.save();
    world.__clear();
    assert.equal(mapString, "");
});

it("non-standard center save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/19",
            position: new MockVector(0, 0, 0),
        })
    );
    const mapString = MapStringSave.save();
    world.__clear();
    assert.equal(mapString, "{19}");
});

it("hyperlane center save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/84",
            position: new MockVector(0, 0, 0),
            rotation: new MockRotator(0, 60, 180),
        })
    );
    const mapString = MapStringSave.save();
    world.__clear();
    assert.equal(mapString, "{84B1}");
});

it("missing entry", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/1",
            position: new MockVector(-Hex.HALF_SIZE * 2, 0, 0), // below center one ring
        })
    );
    const mapString = MapStringSave.save();
    world.__clear();
    assert.equal(mapString, "{0} 0 0 0 1");
});
