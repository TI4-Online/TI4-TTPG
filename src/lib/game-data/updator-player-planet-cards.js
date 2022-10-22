/**
 * Normal game-data only has a planet summary.  This module reports the planet cards, intended for data export.
 */
const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.planetCards = [];
    });

    const checkIsDiscardPile = true;
    const allowFaceDown = true;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
            continue;
        }
        const planet = world.TI4.getPlanetByCard(obj);
        if (!planet) {
            continue;
        }

        const pos = obj.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!closestDesk) {
            continue;
        }
        const playerData = data.players[closestDesk.index];
        assert(playerData);

        const name = obj.getCardDetails().name;
        playerData.planetCards.push(name);
    }
};
