const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.planetTotals = {
            influence: { avail: -1, total: -1 },
            resources: { avail: -1, total: -1 },
            techs: { blue: -1, red: -1, green: -1, yellow: -1 },
            traits: { cultural: -1, hazardous: -1, industrial: -1 },
            legendary: -1,
        };
    });

    // TODO XXX
};
