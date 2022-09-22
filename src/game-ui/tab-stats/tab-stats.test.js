require("../../global"); // create world.TI4
const assert = require("assert");
const { TabStats } = require("./tab-stats");

it("constructor", () => {
    new TabStats();
});

it("getPlayerDataSync", () => {
    const data = TabStats.getPlayerDataSync();
    assert(Array.isArray(data.players));
    assert(data.timestamp);
});
