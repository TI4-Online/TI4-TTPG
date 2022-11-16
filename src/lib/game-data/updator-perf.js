const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.perf = world.TI4.perfStats.summarize();
};
