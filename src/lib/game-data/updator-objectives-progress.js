const { world } = require("../../wrapper/api");

module.exports = (data) => {
    const getAll = true;
    data.objectivesProgress =
        world.TI4.objectivesReporter.getJsonReadySummary(getAll);
};
