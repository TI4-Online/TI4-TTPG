const assert = require("assert");
const { PerfStats } = require("./perf-stats");

it("constructor", () => {
    new PerfStats();
});

it("average", () => {
    const perfStats = new PerfStats(5);

    // Fill window (param is seconds, stats are msec)
    perfStats._onTickHandler(0.001);
    perfStats._onTickHandler(0.002);
    perfStats._onTickHandler(0.003);
    perfStats._onTickHandler(0.004);
    perfStats._onTickHandler(0.005);

    let mean;
    ({ mean } = perfStats.summarize());
    assert.equal(mean, 3);

    // Add more, overwrite oldest.
    perfStats._onTickHandler(0.006);
    perfStats._onTickHandler(0.007);

    ({ mean } = perfStats.summarize());
    assert.equal(mean, 5);
});
