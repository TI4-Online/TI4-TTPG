const assert = require("assert");
const { GlobalSavedData } = require("./global-saved-data");

it("get default", () => {
    const result = GlobalSavedData.get("does_not_exist", 7);
    assert.equal(result, 7);
});

it("set/get", () => {
    const key = "myKey";
    let result = GlobalSavedData.get(key, 7);
    assert.equal(result, 7); // default

    GlobalSavedData.set(key, 13);
    result = GlobalSavedData.get(key, 7);
    assert.equal(result, 13);
});
