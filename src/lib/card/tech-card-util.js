const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { CardUtil } = require("../../lib/card/card-util");
const {
    Card,
    CardHolder,
    GameObject,
    Rotator,
    world,
} = require("../../wrapper/api");

class TechCardUtil {
    /**
     * Static-only class.
     */
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Searches for the nearest technology cards for a given nsid
     * and deals it to the player in the passed playerSlot.
     *
     * If not all cards were found, the missing number is mentioned as a warning.
     *
     * @param {string[]} techNsidNames - list of card nsids
     * @param {number} playerSlot
     * @returns
     */
    static moveCardsToCardHolder(techNsidNames, playerSlot) {
        assert(Array.isArray(techNsidNames));
        techNsidNames.forEach((nsid) => assert(typeof nsid === "string"));
        assert(Number.isInteger(playerSlot));

        if (techNsidNames.length === 0) {
            return;
        }
        const cards = CardUtil.gatherCards((nsid, cardOrDeckObj) => {
            if (!nsid.startsWith("card.technology")) {
                return false;
            }
            if (!techNsidNames.includes(nsid)) {
                return false;
            }
            const pos = cardOrDeckObj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            return closestDesk.playerSlot === playerSlot;
        });
        if (cards.length !== techNsidNames.length) {
            console.warn(
                `not all cards found (${
                    techNsidNames.length - cards.length
                } missing)`
            );
            return;
        }

        const deck = CardUtil.makeDeck(cards); // cards were found, not spawned, no need for clone replace
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }
}

module.exports = { TechCardUtil };
