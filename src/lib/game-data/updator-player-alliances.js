const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.alliances = [];
    });

    const checkIsDiscardPile = false;
    const allowFaceDown = false;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (
            !nsid.startsWith("card.promissory") ||
            !nsid.endsWith("/alliance")
        ) {
            continue;
        }
        const parsed = ObjectNamespace.parseNsid(nsid);
        const parts = parsed.type.split(".");
        const color = parts[2];

        const pos = obj.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!closestDesk) {
            continue;
        }
        const playerData = data.players[closestDesk.index];
        assert(playerData);

        if (!playerData.alliances.includes(color)) {
            playerData.alliances.push(color);
        }
    }
};
