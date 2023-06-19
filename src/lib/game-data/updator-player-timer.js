const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.playerTimer = world.TI4.playerTimer.exportForGameData();
};
