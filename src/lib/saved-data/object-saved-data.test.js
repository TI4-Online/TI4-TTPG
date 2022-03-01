const assert = require("assert");
const { ObjectSavedData } = require("./object-saved-data");
const { MockGameObject } = require("../../wrapper/api");

it("get default", () => {
    const obj = new MockGameObject();
    const result = ObjectSavedData.get(obj, "does_not_exist", 7);
    assert.equal(result, 7);
});

it("set/get", () => {
    const key = "myKey";
    const obj = new MockGameObject();
    let result = ObjectSavedData.get(obj, key, 7);
    assert.equal(result, 7); // default

    ObjectSavedData.set(obj, key, 13);
    result = ObjectSavedData.get(obj, key, 7);
    assert.equal(result, 13);
});
