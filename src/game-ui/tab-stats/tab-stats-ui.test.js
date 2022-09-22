require("../../global");
const { TabStats } = require("./tab-stats");
const { TabStatsUI } = require("./tab-stats-ui");

it("constructor", () => {
    new TabStatsUI();
});

it("update", () => {
    const tabStatsUI = new TabStatsUI();
    const data = TabStats.getPlayerDataSync();
    tabStatsUI.update(data);
});
