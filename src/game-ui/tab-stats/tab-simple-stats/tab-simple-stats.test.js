require("../../../global");
const { TabSimpleStats } = require("./tab-simple-stats");
const { TabSimpleStatsUI } = require("./tab-simple-stats-ui");

it("constructor", () => {
    new TabSimpleStatsUI();
});

it("update", () => {
    const tabSimpleStatsUI = new TabSimpleStatsUI();
    const data = TabSimpleStats.getPlayerDataSync();
    tabSimpleStatsUI.update(data);
});
