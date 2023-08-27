const assert = require("../../wrapper/assert-wrapper");
const { FindTurnOrder } = require("./find-turn-order");
const { Spawn } = require("../../setup/spawn/spawn");
const { ObjectNamespace } = require("../object-namespace");
const { GameObject, Rotator, Vector, world } = require("../../wrapper/api");

const TRADEGOOD_NSID = "token:base/tradegood_commodity_1";
const TRADEGOOD_ROLL = 180;

/**
 * Place a tradegood on an unpicked strategy card.
 */
class PlaceTradegoodUnpicked {
    constructor() {
        throw new Error("static only");
    }

    static getUnpickedStrategyCards() {
        const unpickedStrategyCards = [];
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            if (!ObjectNamespace.isStrategyCard(obj)) {
                continue; // not a strategy card.
            }
            if (FindTurnOrder.isStrategyCardPicked(obj)) {
                continue; // picked, ignore it
            }
            unpickedStrategyCards.push(obj);
        }
        return unpickedStrategyCards;
    }

    static placeOne(strategyCard) {
        assert(strategyCard instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCard));

        const noiseD = 1;
        const noise = new Vector(
            Math.random() * noiseD * 2 - noiseD,
            Math.random() * noiseD * 2 - noiseD,
            5
        );
        const pos = strategyCard.getPosition().add(noise);
        const rot = new Rotator(0, 0, TRADEGOOD_ROLL);
        Spawn.spawn(TRADEGOOD_NSID, pos, rot);
    }

    static placeAll() {
        const unpickedStrategyCards =
            PlaceTradegoodUnpicked.getUnpickedStrategyCards();
        for (const unpickedStrategyCard of unpickedStrategyCards) {
            this.placeOne(unpickedStrategyCard);
        }
    }
}

module.exports = { PlaceTradegoodUnpicked };
