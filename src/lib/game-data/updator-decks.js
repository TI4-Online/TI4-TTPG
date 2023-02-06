/**
 * CAREFUL, THIS EXPOSES SECRET INFORMATIN (cards in hand).
 * NOT INTENDED FOR NORMAL GAME-DATA USE!
 */
const { DealDiscard, DECKS } = require("../card/deal-discard");

module.exports = (data) => {
    data.decks = {};

    for (const deckData of DECKS) {
        const entry = {};
        data.decks[deckData.nsidPrefix] = entry;

        const deck = DealDiscard.getDeckWithReshuffle(deckData.nsidPrefix, 0);
        const discard =
            deckData.discardSnapPointIndex >= 0
                ? DealDiscard.getDiscard(deckData.nsidPrefix)
                : undefined;

        if (deck) {
            entry.deck = deck
                .getAllCardDetails()
                .map((cardDetails) => cardDetails.name);
        }
        if (discard) {
            entry.discard = discard
                .getAllCardDetails()
                .map((cardDetails) => cardDetails.name);
        }
    }
};
