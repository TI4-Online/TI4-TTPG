const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { FindTurnOrder } = require("../../lib/phase/find-turn-order");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");
const { Facing } = require("../facing");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.strategyCards = [];
        playerData.strategyCardsFaceDown = [];
    });

    const skipContained = true;
    for (const obj of world.getAllObjects(skipContained)) {
        if (!ObjectNamespace.isStrategyCard(obj)) {
            continue; // not a strategy card.
        }
        if (obj.isHeld()) {
            continue; // currently held by a player's pointer
        }
        if (!FindTurnOrder.isStrategyCardPicked(obj)) {
            continue; // not picked, ignore it
        }

        const parsed = ObjectNamespace.parseStrategyCard(obj);
        const localeName = "tile.strategy." + parsed.card;
        const strategyCardName = locale(localeName);

        const pos = obj.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        const playerIndex = closestDesk.index;

        const playerData = data.players[playerIndex];
        assert(playerData && playerData.strategyCards);
        playerData.strategyCards.push(strategyCardName);

        if (Facing.isFaceDown(obj)) {
            playerData.strategyCardsFaceDown.push(strategyCardName);
        }
    }
};
