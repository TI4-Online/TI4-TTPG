const { world } = require("../../wrapper/api");

module.exports = (data) => {
    const getAll = false;
    data.objectivesProgress =
        world.TI4.objectivesReporter.getJsonReadySummary(getAll);
};
