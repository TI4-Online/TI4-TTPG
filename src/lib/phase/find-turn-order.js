const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { GameObject, world } = require("../../wrapper/api");

const ZERO_TOKEN_NSID = "token.naalu:base/zero";

const STRATEGY_CARD_INITIATIVE = {
    leadership: 1,
    diplomacy: 2,
    politics: 3,
    construction: 4,
    trade: 5,
    warfare: 6,
    technology: 7,
    imperial: 8,
};

let _strategyCardMat = false;

/**
 * Determine turn order based on strategy cards (and Naalu zero token).
 */
class FindTurnOrder {
    constructor() {
        throw new Error("static only");
    }

    static getStrategyCardMat() {
        if (!_strategyCardMat || !_strategyCardMat.isValid()) {
            _strategyCardMat = false;
            const skipContained = true;
            for (const obj of world.getAllObjects(skipContained)) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === "mat:base/strategy_card") {
                    _strategyCardMat = obj;
                    break;
                }
            }
        }
        return _strategyCardMat;
    }

    /**
     * Has this strategy card been picked?
     *
     * @param {GameObject} strategyCard
     * @returns {boolean}
     */
    static isStrategyCardPicked(strategyCard) {
        assert(strategyCard instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCard));

        const strategyCardMat = FindTurnOrder.getStrategyCardMat();
        if (!strategyCardMat) {
            return true;
        }

        const center = strategyCardMat.getExtentCenter();
        const extent = strategyCardMat.getExtent(true);
        const bb = {
            min: {
                x: center.x - extent.x,
                y: center.y - extent.y,
            },
            max: {
                x: center.x + extent.x,
                y: center.y + extent.y,
            },
        };
        const pos = strategyCard.getPosition();
        return (
            pos.x < bb.min.x ||
            pos.x > bb.max.x ||
            pos.y < bb.min.y ||
            pos.y > bb.max.y
        );
    }

    static numPickedStrategyCards() {
        let count = 0;
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            if (!ObjectNamespace.isStrategyCard(obj)) {
                continue; // not a strategy card.
            }
            if (!FindTurnOrder.isStrategyCardPicked(obj)) {
                continue; // not picked, ignore it
            }
            count += 1;
        }
        return count;
    }

    /**
     * Find initiave order based on strategy cards and Naalu zero token.
     *
     * @returns {Array.{PlayerDesk}} Turn order by player desk
     */
    static order() {
        // Find initiative objects.
        const initiativeObjects = [];
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            // Check for Naalu zero token.
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === ZERO_TOKEN_NSID) {
                initiativeObjects.push({
                    obj,
                    initiative: 0,
                });
                continue;
            }

            // At this point we only want strategy cards.
            if (!ObjectNamespace.isStrategyCard(obj)) {
                continue; // not a strategy card.
            }
            if (!FindTurnOrder.isStrategyCardPicked(obj)) {
                continue; // not picked, ignore it
            }

            // Now we have a strategy card considered to be chosen by a player.
            const parsed = ObjectNamespace.parseStrategyCard(obj);
            let initiative = STRATEGY_CARD_INITIATIVE[parsed.card];

            // Custom homebrew strategy card.
            if (
                parsed.card === "custom" &&
                typeof obj.__initiative === "number"
            ) {
                initiative = obj.__initiative;
                console.log(
                    `FindTurnOrder.order: custom initiative ${initiative}`
                );
            }

            if (typeof initiative !== "number") {
                initiative = Math.MAX_SAFE_INTEGER;
            }
            assert(obj instanceof GameObject);
            initiativeObjects.push({
                obj,
                initiative,
            });
        }

        // Seed initiatives.
        const playerSlotToInitiative = {};
        const playerSlotToPlayerDesk = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerSlotToInitiative[playerDesk.playerSlot] =
                Number.MAX_SAFE_INTEGER;
            playerSlotToPlayerDesk[playerDesk.playerSlot] = playerDesk;
        }

        // Player initiative is lowest of any initiative object.
        for (const initiativeObject of initiativeObjects) {
            const obj = initiativeObject.obj;
            const initiative = initiativeObject.initiative;
            const playerDesk = world.TI4.getClosestPlayerDesk(
                obj.getPosition()
            );
            if (playerSlotToInitiative[playerDesk.playerSlot] > initiative) {
                playerSlotToInitiative[playerDesk.playerSlot] = initiative;
            }
        }

        // Order.
        const order = Object.keys(playerSlotToInitiative);
        order.sort((a, b) => {
            a = playerSlotToInitiative[a];
            b = playerSlotToInitiative[b];
            if (a === undefined) {
                a = Number.MAX_SAFE_INTEGER;
            }
            if (b === undefined) {
                b = Number.MAX_SAFE_INTEGER;
            }
            return a - b;
        });
        // Boo, javascript makes these strings when used as keys.  Get numbers.
        return order.map((slotStr) => {
            return playerSlotToPlayerDesk[slotStr];
        });
    }
}

module.exports = { FindTurnOrder };
