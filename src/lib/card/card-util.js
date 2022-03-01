const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const {
    Card,
    CardHolder,
    GameObject,
    Rotator,
    world,
} = require("../../wrapper/api");
const { DealDiscard } = require("./deal-discard");

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
    static isLooseCard(card, checkIsDiscardPile = false) {
        assert(card instanceof GameObject);

        return (
            card instanceof Card &&
            card.isFaceUp() &&
            card.getStackSize() === 1 &&
            !card.getContainer() &&
            !card.isHeld() &&
            !card.isInHolder() &&
            (!checkIsDiscardPile || !CardUtil.isLoneCardInDiscardPile(card)) // do this last, expensive
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
        const nsid = ObjectNamespace.getNsid(card);
        const discard = DealDiscard.getDiscard(nsid);
        discard === card;
    }

    /**
     * Does the player have the given card?
     *
     * @param {number} playerSlot
     * @param {string} cardNsid
     * @returns {boolean}
     */
    static hasCard(playerSlot, cardNsid) {
        assert(typeof playerSlot === "number");
        assert(typeof cardNsid === "string");
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== cardNsid) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj)) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk.playerSlot !== playerSlot) {
                continue;
            }
            return true;
        }
    }

    /**
     * Get cards on table, on-table decks, and card holders.
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
            if (!(obj instanceof Card)) {
                continue;
            }

            if (obj.getStackSize() > 1) {
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
                    if (obj.isInHolder()) {
                        obj.removeFromHolder();
                    }
                    result.push(obj);
                }
            }
        }
        return result;
    }

    /**
     * Make a deck from cards.
     *
     * @param {Array.{Card}} cards
     * @returns {Card}
     */
    static makeDeck(cards) {
        assert(Array.isArray(cards));
        if (cards.length == 0) {
            return undefined;
        }

        const deck = cards.shift();
        assert(deck instanceof Card);
        if (deck.isInHolder()) {
            deck.removeFromHolder();
        }

        for (const card of cards) {
            assert(card instanceof Card);
            deck.addCards(card);
        }
        return deck;
    }

    /**
     * Split a deck ("Card" with multiple cards) into indivudual card objects.
     *
     * @param {Card} deck
     * @returns {Array.{Card}}
     */
    static separateDeck(deck) {
        assert(deck instanceof Card);

        if (deck.isInHolder()) {
            deck.removeFromHolder();
        }

        const result = [];
        while (deck.getStackSize() > 1) {
            result.push(deck.takeCards(1, true, 1));
        }
        result.push(deck);
        return result;
    }

    /**
     * Get card holder for player slot.
     *
     * @param {number} playerSlot
     * @returns {CardHolder}
     */
    static getCardHolder(playerSlot) {
        assert(typeof playerSlot === "number");

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (!(obj instanceof CardHolder)) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            return obj;
        }
    }

    /**
     * Move one or more cards to a card holder.
     *
     * If the card is a deck, separate cards.
     * Orient cards facing up.
     *
     * @param {Card} card - single card, or deck
     * @param {number} playerSlot
     * @returns {boolean} true if moved to holder
     */
    static moveCardsToCardHolder(card, playerSlot) {
        assert(card instanceof Card);
        assert(typeof playerSlot === "number");

        const cardHolder = CardUtil.getCardHolder(playerSlot);
        if (!cardHolder) {
            return false;
        }

        const cards = CardUtil.separateDeck(card);
        for (const card of cards) {
            if (!card.isFaceUp()) {
                const rot = new Rotator(0, 0, 180).compose(card.getRotation());
                card.setRotation(rot);
            }

            const index = cardHolder.getNumCards();
            cardHolder.insert(card, index);
        }

        return true;
    }
}

module.exports = { CardUtil };
