const assert = require("../../wrapper/assert-wrapper");
const { Facing } = require("../facing");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.commodities = 0;
        playerData.tradeGoods = 0;
    });

    const tokensAndValues = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "token:base/tradegood_commodity_1") {
            tokensAndValues.push({ token: obj, value: 1 });
        } else if (nsid === "token:base/tradegood_commodity_3") {
            tokensAndValues.push({ token: obj, value: 3 });
        }
    }

    for (const { token, value } of tokensAndValues) {
        const pos = token.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        const index = closestDesk.index;
        const playerData = data.players[index];
        if (Facing.isFaceUp(token)) {
            playerData.commodities += value;
        } else {
            playerData.tradeGoods += value;
        }
    }
};
