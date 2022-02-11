const assert = require("assert");
const { MapStringSave } = require("./map-string-save");
const { MockGameObject, MockRotator, world } = require("../../wrapper/api");

it("empty save", () => {
    world.__clear();
    const mapString = MapStringSave.save();
    assert.equal(mapString, "");
});

it("mecatol-only save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/18" })
    );
    const mapString = MapStringSave.save();
    assert.equal(mapString, "");
});

it("non-standard center save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({ templateMetadata: "tile.system:base/19" })
    );
    const mapString = MapStringSave.save();
    assert.equal(mapString, "{19}");
});

it("hyperlane center save", () => {
    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/84",
            rotation: new MockRotator(0, 60, 180),
        })
    );
    const mapString = MapStringSave.save();
    assert.equal(mapString, "{84B1}");
});
