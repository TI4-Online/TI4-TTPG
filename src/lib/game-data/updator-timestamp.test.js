require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-timestamp");

it("round", () => {
    const data = {};
    UPDATOR(data);
    assert(data.timestamp);
});
