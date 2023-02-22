const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, globalEvents } = require("../wrapper/api");

/**
 * TTPG does not (yet) offer persistent card descriptions; they get cleared
 * when adding a card to a deck.  Watch for certain cards and add descriptions.
 */
class CardDescriptions {
    static _getDescription(card) {
        assert(card instanceof Card);
        const parsed = ObjectNamespace.parseCard(card);
        if (!parsed) {
            return;
        }
        const key = `desc.${parsed.type}.${parsed.name}`;
        const result = locale(key);
        return result === key ? undefined : result;
    }

    static maybeAddDescription(card) {
        assert(card instanceof Card);
        const description = CardDescriptions._getDescription(card);
        if (description) {
            card.setDescription(description);
        }
    }

    static maybeRemoveDescription(card) {
        assert(card instanceof Card);
        // At this point card is already a deck.
        // For now just clear descriptions on decks.
        if (card.getDescription().length > 0) {
            card.setDescription("");
        }
    }
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    CardDescriptions.maybeAddDescription(card);
});
globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    CardDescriptions.maybeRemoveDescription(card);
});
