const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.leaders = {};
    });

    const checkIsDiscardPile = false;
    const allowFaceDown = true;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.leader")) {
            continue;
        }
        const parsed = ObjectNamespace.parseNsid(nsid);
        const parts = parsed.type.split(".");
        const leaderType = parts[2];

        if (leaderType === "mech") {
            continue;
        }

        // Use desk instead of card faction in case of Franken.
        const pos = obj.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!closestDesk) {
            continue;
        }
        const playerData = data.players[closestDesk.index];
        assert(playerData);

        // Nomad has three agents, just let the last found card win.
        playerData.leaders[leaderType] = obj.isFaceUp() ? "unlocked" : "locked";
    }
};
