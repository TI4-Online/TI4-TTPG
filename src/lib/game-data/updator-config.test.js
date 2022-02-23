require("../../global"); // register world.TI4
const assert = require("assert");
const updatorConfig = require("./updator-config");
const { world } = require("../../wrapper/api");

it("updator", () => {
    world.TI4.reset();
    let data = {};
    updatorConfig(data);
    assert.deepEqual(data, { isPoK: true, scoreboard: 10, setupTimestamp: 0 });

    world.TI4.config.setPoK(false);
    world.TI4.config.setGamePoints(12);
    world.TI4.config.setTimestamp(1);

    data = {};
    updatorConfig(data);
    assert.deepEqual(data, { isPoK: false, scoreboard: 12, setupTimestamp: 1 });
});
