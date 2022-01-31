const { ReplaceObjects } = require("./replace-objects");
const { MockGameObject, world } = require("../../wrapper/api");
const assert = require("../../wrapper/assert");

it("static getReplacedObjects", () => {
    const addNsids = [
        "tile.strategy:base/construction", // replaced by :pok
        "tile.strategy:pok/construction", // replaces :base
        "tile.strategy:base/leadership", // inert
    ];
    for (const addNsid of addNsids) {
        world.__addObject(
            new MockGameObject({
                templateMetadata: addNsid,
            })
        );
    }

    let replacedObjects;
    try {
        replacedObjects = ReplaceObjects.getReplacedObjects();
    } finally {
        world.__clear();
    }
    assert.equal(replacedObjects.length, 1);
    assert.equal(
        replacedObjects[0].getTemplateMetadata(),
        "tile.strategy:base/construction"
    );
});
