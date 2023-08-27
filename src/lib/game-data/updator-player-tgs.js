const assert = require("../../wrapper/assert-wrapper");
const { Facing } = require("../facing");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.commodities = 0;
        playerData.tradeGoods = 0;
        playerData.maxCommodities = 0;
    });

    const tokensAndValues = [];

    const skipContained = true;
    let strategyCardMat = undefined;
    let artuno = undefined;
    for (const obj of world.getAllObjects(skipContained)) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "token:base/tradegood_commodity_1") {
            tokensAndValues.push({ token: obj, value: 1 });
        } else if (nsid === "token:base/tradegood_commodity_3") {
            tokensAndValues.push({ token: obj, value: 3 });
        } else if (nsid === "mat:base/strategy_card") {
            strategyCardMat = obj;
        } else if (nsid === "card.leader.agent.nomad:pok/artuno_the_betrayer") {
            artuno = obj;
        }
    }

    for (const { token, value } of tokensAndValues) {
        const pos = token.getPosition();

        // Ignore if on the strategy card mat.
        if (strategyCardMat) {
            const matPos = strategyCardMat.worldPositionToLocal(pos);
            const extent = strategyCardMat.getExtent();
            if (
                Math.abs(matPos.x) < extent.x &&
                Math.abs(matPos.y) < extent.y
            ) {
                continue;
            }
        }

        // Ignore if on artuno the betrayer (nomad agent).
        if (artuno) {
            const artPos = artuno.worldPositionToLocal(pos);
            const extent = artuno.getExtent();
            if (
                Math.abs(artPos.x) < extent.x &&
                Math.abs(artPos.y) < extent.y
            ) {
                continue;
            }
        }

        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        const index = closestDesk.index;
        const playerData = data.players[index];
        if (Facing.isFaceUp(token)) {
            playerData.commodities += value;
        } else {
            playerData.tradeGoods += value;
        }
    }

    world.TI4.getAllPlayerDesks().forEach((playerDesk, index) => {
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerData = data.players[playerDesk.index];
        if (playerData && faction) {
            playerData.maxCommodities = faction.raw?.commodities;
        }
    });
};
