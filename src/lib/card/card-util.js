const assert = require("../../wrapper/assert-wrapper");
const { Card, GameObject } = require("../../wrapper/api");

class CardUtil {
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

    static isLoneCardInDiscardPile(card) {
        // TODO XXX
        return false;
    }
}

module.exports = { CardUtil };
