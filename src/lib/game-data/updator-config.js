const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.isPoK = world.TI4.config.pok;
    data.scoreboard = world.TI4.config.gamePoints;
    data.setupTimestamp = world.TI4.config.timestamp;
};
