const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { Hex } = require("../../lib/hex");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.planetTotals = {
            influence: { avail: 0, total: 0 },
            resources: { avail: 0, total: 0 },
            techs: { blue: 0, red: 0, green: 0, yellow: 0 },
            traits: { cultural: 0, hazardous: 0, industrial: 0 },
            legendary: 0,
        };
    });

    const systemHexSet = new Set();
    for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
        const pos = systemTileObj.getPosition();
        const hex = Hex.fromPosition(pos);
        systemHexSet.add(hex);
    }

    const skipContained = true;
    const checkIsDiscardPile = false;
    const allowFaceDown = true;
    for (const obj of world.getAllObjects(skipContained)) {
        if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
            continue;
        }
        const planet = world.TI4.getPlanetByCard(obj);
        if (!planet) {
            continue;
        }

        const pos = obj.getPosition();
        const hex = Hex.fromPosition(pos);
        if (systemHexSet.has(hex)) {
            continue; // on a system tile
        }

        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!closestDesk) {
            continue;
        }
        const playerData = data.players[closestDesk.index];
        assert(playerData);

        const planetTotals = playerData.planetTotals;
        planetTotals.influence.total += planet.raw.influence;
        planetTotals.resources.total += planet.raw.resources;
        if (obj.isFaceUp()) {
            planetTotals.influence.avail += planet.raw.influence;
            planetTotals.resources.avail += planet.raw.resources;
        }
        if (planet.raw.tech) {
            for (const tech of planet.raw.tech) {
                planetTotals.techs[tech] += 1;
            }
        }
        if (planet.raw.trait) {
            for (const trait of planet.raw.trait) {
                planetTotals.traits[trait] += 1;
            }
        }
        if (planet.raw.legendary) {
            planetTotals.legendary += 1;
        }
    }
};
