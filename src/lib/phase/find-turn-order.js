const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { PlayerDesk } = require("../player-desk");
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

/**
 * Determine turn order based on strategy cards (and Naalu zero token).
 */
class FindTurnOrder {
    constructor() {
        throw new Error("static only");
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

        // XXX TODO check if on strategy card mat?
        return true;
    }

    /**
     * Find initiave order based on strategy cards and Naalu zero token.
     *
     * @returns {Array.{number}} Turn order by player slot
     */
    static order() {
        // Find initiative objects.
        const initiativeObjects = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside containers
            }

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
            const initiative = STRATEGY_CARD_INITIATIVE[parsed.card];
            assert(typeof initiative === "number");
            assert(obj instanceof GameObject);
            initiativeObjects.push({
                obj,
                initiative,
            });
        }

        // Seed initiatives.
        const playerSlotToInitiative = {};
        for (const playerDesk of PlayerDesk.getPlayerDesks()) {
            playerSlotToInitiative[playerDesk.playerSlot] =
                Number.MAX_SAFE_INTEGER;
        }

        // Player initiative is lowest of any initiative object.
        for (const initiativeObject of initiativeObjects) {
            const obj = initiativeObject.obj;
            const initiative = initiativeObject.initiative;
            const playerDesk = PlayerDesk.getClosest(obj.getPosition());
            if (playerSlotToInitiative[playerDesk.playerSlot] > initiative) {
                playerSlotToInitiative[playerDesk.playerSlot] = initiative;
            }
        }

        // Order.
        const order = Object.keys(playerSlotToInitiative);
        order.sort(
            (a, b) => playerSlotToInitiative[a] - playerSlotToInitiative[b]
        );
        return order;
    }
}

module.exports = { FindTurnOrder };
