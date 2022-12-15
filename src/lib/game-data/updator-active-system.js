const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.activeSystem = {};

    const activeSystemTileObj = world.TI4.getActiveSystemTileObject();
    if (!activeSystemTileObj) {
        return;
    }
    const system = world.TI4.getSystemBySystemTileObject(activeSystemTileObj);
    if (!system) {
        return;
    }
    data.activeSystem = {
        tile: system.tile,
        planets: system.planets.map((planet) => planet.getNameStr()),
    };
};
