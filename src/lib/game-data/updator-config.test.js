require("../../global"); // register world.TI4
const assert = require("assert");
const updatorConfig = require("./updator-config");
const { world } = require("../../wrapper/api");

it("config", () => {
    world.TI4.reset();
    let data = {};
    updatorConfig(data);
    assert.deepEqual(data, {
        config: {
            codex1: true,
            codex2: true,
            codex3: true,
            baseMagen: false,
        },
        isPoK: true,
        scoreboard: 10,
        setupTimestamp: 0,
    });

    world.TI4.config.setPoK(false);
    world.TI4.config.setGamePoints(12);
    world.TI4.config.setTimestamp(1);

    data = {};
    updatorConfig(data);
    assert.deepEqual(data, {
        config: {
            codex1: true,
            codex2: true,
            codex3: true,
            baseMagen: false,
        },
        isPoK: false,
        scoreboard: 12,
        setupTimestamp: 1,
    });
});
