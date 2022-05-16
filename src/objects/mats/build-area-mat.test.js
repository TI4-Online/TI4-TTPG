require("../../global"); // register world.TI4
const assert = require("assert");
const { BuildAreaMat } = require("./build-area-mat");
const { MockGameObject } = require("../../wrapper/api");

it("constructor", () => {
    const obj = new MockGameObject();
    const buildAreaMat = new BuildAreaMat(obj);
    assert(buildAreaMat);
});
