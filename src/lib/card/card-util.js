const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { Card, GameObject, world } = require("../../wrapper/api");

class CardUtil {
    /**
     * Static-only class.
     */
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Is this a loose card on the table?
     *
     * - is a card
     * - is face up
     * - not a deck
     * - not in a container
     * - not held by player's pointer
     * - not in a card holder
     * - not the lone card in a discard pile
     *
     * @param {GameObject} card
     * @return {boolean} true if a loose card.
     */
    static isLooseCard(card) {
        assert(card instanceof GameObject);

        return (
            card instanceof Card &&
            card.isFaceUp() &&
            card.getStackSize() === 1 &&
            !card.getContainer() &&
            !card.isHeld() &&
            !card.isInHolder() &&
            !CardUtil.isLoneCardInDiscardPile(card)
        );
    }

    /**
     * Is this loose card the lone card in a discard pile?
     *
     * @param {Card} card
     * @returns {boolean}
     */
    static isLoneCardInDiscardPile(card) {
        assert(card instanceof Card);
        // TODO XXX
        return false;
    }

    /**
     * Get cards on table or from on-table decks.
     *
     * @param {function} filterNsid - (nsid: string, cardOrDeck: GameObject) => boolean
     * @returns {Array.{Card}}
     */
    static gatherCards(filterNsid) {
        assert(typeof filterNsid === "function");

        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // only scan on-table objects
            }

            if (obj instanceof Card && obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    if (filterNsid(nsid, obj)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
                        assert(cardObj instanceof Card);
                        result.push(cardObj);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                if (filterNsid(nsid, obj)) {
                    result.push(obj);
                }
            }
        }
        return result;
    }
}

module.exports = { CardUtil };
