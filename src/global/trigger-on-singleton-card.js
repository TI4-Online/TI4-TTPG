/**
 * When the second-last card is removed from a deck, the remaining singleton
 * card does not trigger onObjectCreated.  Watch for this (and the reverse)
 * triggering a new synthetic event.
 */

const assert = require("../wrapper/assert-wrapper");
const { Card, globalEvents, world } = require("../wrapper/api");

let onInsertedHandler;
let onRemovedHandler;

onInsertedHandler = (deck, insertedCard, position, player) => {
    // This handler is only installed on singleton cards, and other card(s)
    // have already been added to deck before calling this.  So remove
    // this handler, and signal the card is now a deck.
    assert(deck instanceof Card);
    assert(deck.getStackSize() > 1);
    deck.onInserted.remove(onInsertedHandler);
    deck.onRemoved.remove(onRemovedHandler);
    deck.onRemoved.add(onRemovedHandler);
    globalEvents.TI4.onSingletonCardMadeDeck.trigger(deck);
};

onRemovedHandler = (deck, removedCard, position, player) => {
    // Called after card is removed.
    assert(deck instanceof Card);
    if (deck.getStackSize() === 1) {
        deck.onRemoved.remove(onRemovedHandler);
        deck.onInserted.remove(onInsertedHandler);
        deck.onInserted.add(onInsertedHandler);
        globalEvents.TI4.onSingletonCardCreated.trigger(deck);
    }
};

globalEvents.onObjectCreated.add((obj) => {
    if (!(obj instanceof Card)) {
        return;
    }
    // Strange things happen when making a deck.  Wait a frame then see.
    process.nextTick(() => {
        if (obj.getStackSize() > 1) {
            // deck
            obj.onRemoved.remove(onRemovedHandler);
            obj.onRemoved.add(onRemovedHandler);
        } else {
            // singleton card
            obj.onInserted.remove(onInsertedHandler);
            obj.onInserted.add(onInsertedHandler);
            globalEvents.TI4.onSingletonCardCreated.trigger(obj);
        }
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (!(obj instanceof Card)) {
            continue;
        }
        if (obj.getStackSize() > 1) {
            obj.onRemoved.remove(onRemovedHandler);
            obj.onRemoved.add(onRemovedHandler);
        } else {
            obj.onInserted.remove(onInsertedHandler);
            obj.onInserted.add(onInsertedHandler);
        }
    }
}
