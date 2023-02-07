const locale = require("../../lib/locale");
const { FindTurnOrder } = require("../../lib/phase/find-turn-order");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.unpickedStrategyCards = {};

    // Get unpicked cards and strategy card mat.
    let strategyCardMat = undefined;
    const unpicked = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue; // ignore inside containers
        }

        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "mat:base/strategy_card") {
            strategyCardMat = obj;
        }
        if (!ObjectNamespace.isStrategyCard(obj)) {
            continue; // not a strategy card.
        }
        if (obj.isHeld()) {
            continue; // currently held by a player's pointer
        }
        if (FindTurnOrder.isStrategyCardPicked(obj)) {
            continue; // picked, ignore it
        }

        // Add an entry for it starting with zero tradegoods,
        // update those in the next pass.
        const parsed = ObjectNamespace.parseStrategyCard(obj);
        const localeName = "tile.strategy." + parsed.card;
        const strategyCardName = locale(localeName);
        data.unpickedStrategyCards[strategyCardName] = 0;

        unpicked.push(obj);
    }

    if (!strategyCardMat || unpicked.length === 0) {
        return;
    }
    const extent = strategyCardMat.getExtent();

    // Assign TGs to closest card.
    const nsidToValue = {
        "token:base/tradegood_commodity_1": 1,
        "token:base/tradegood_commodity_3": 3,
    };
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue; // ignore inside containers
        }
        if (obj.isHeld()) {
            continue; // currently held by a player's pointer
        }

        const nsid = ObjectNamespace.getNsid(obj);
        const value = nsidToValue[nsid];
        if (!value) {
            continue; // not a tradegood
        }

        const pos = obj.getPosition();
        const matPos = strategyCardMat.worldPositionToLocal(pos);
        if (Math.abs(matPos.x) > extent.x || Math.abs(matPos.y) > extent.y) {
            continue; // not inside strategy card mat area
        }

        let closest = undefined;
        let bestDSq = Number.MAX_VALUE;
        for (const candidate of unpicked) {
            const dSq = candidate
                .getPosition()
                .subtract(pos)
                .magnitudeSquared();
            if (!closest || dSq < bestDSq) {
                closest = candidate;
                bestDSq = dSq;
            }
        }
        if (!closest) {
            continue;
        }

        const parsed = ObjectNamespace.parseStrategyCard(closest);
        const localeName = "tile.strategy." + parsed.card;
        const strategyCardName = locale(localeName);

        data.unpickedStrategyCards[strategyCardName] =
            (data.unpickedStrategyCards[strategyCardName] || 0) + value;
    }
};
