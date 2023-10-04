/**
 * Got reports of clicking sounds from objective cards with tokens on them.
 * The reports further state locking the card stopped it.
 *
 * Lock face-up objectives automatically.
 */

const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, globalEvents, world } = require("../wrapper/api");

class CardVibrationStomp {
    constructor() {
        throw new Error("static only");
    }

    static _stompHandler = (card) => {
        assert(card instanceof Card);

        console.log("CardVibrationStomp._stompHandler");

        if (!card.isFaceUp()) {
            return; // only lock when face up
        }

        card.freeze();
    };

    static isObjective(card) {
        const nsid = ObjectNamespace.getNsid(card);
        return nsid.startsWith("card.objective");
    }

    static maybeAddHandler(card) {
        if (CardVibrationStomp.isObjective(card)) {
            card.onMovementStopped.add(CardVibrationStomp._stompHandler);
            card.onSnapped.add(CardVibrationStomp._stompHandler);
        }
    }

    static maybeRemoveHandler(card) {
        if (CardVibrationStomp.isObjective(card)) {
            card.onMovementStopped.remove(CardVibrationStomp._stompHandler);
            card.onSnapped.remove(CardVibrationStomp._stompHandler);
        }
    }
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    CardVibrationStomp.maybeAddHandler(card);
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    CardVibrationStomp.maybeRemoveHandler(card);
});

const skipContained = true;
for (const obj of world.getAllObjects(skipContained)) {
    if (obj instanceof Card) {
        CardVibrationStomp.maybeAddHandler(obj);
    }
}
