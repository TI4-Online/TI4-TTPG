const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.objectivesProgress =
        world.TI4.objectivesReporter.getJsonReadySummary();
};
