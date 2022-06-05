const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, globalEvents, refObject, world } = require("../../wrapper/api");

const IGNORE_SET = new Set([
    "token:base/fighter_1",
    "token:base/fighter_3",
    "token:base/infantry_1",
    "token:base/infantry_3",
    "token:base/tradegood_commodity_1",
    "token:base/tradegood_commodity_3",
    "token:pok/frontier",
]);

const IGNORE_TAG = "DELETED_ITEMS_IGNORE";

// (Temporary?) workaround for card deletion tags getting lost.
const _ignoreNsidSet = new Set();

globalEvents.onObjectDestroyed.add((obj) => {
    if (obj === refObject || obj.getContainer() === refObject) {
        return;
    }
    if (obj.getTags().includes(IGNORE_TAG)) {
        return;
    }
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid.length === 0 || IGNORE_SET.has(nsid)) {
        return;
    }
    if (_ignoreNsidSet.has(nsid)) {
        _ignoreNsidSet.delete(nsid);
        return;
    }
    if (nsid.startsWith("token.control:")) {
        return;
    }

    //if (world.TI4.config.timestamp <= 0) {
    //    return; // not set up yet
    //}

    if (refObject.getNumItems() >= refObject.getMaxItems()) {
        // Stop when full.  Could destroy oldest.
        return;
    }

    const json = obj.toJSONString();
    const pos = refObject.getPosition().add([0, 0, 10]);
    const clone = world.createObjectFromJSON(json, pos);
    refObject.addObjects([clone]);
});

refObject.addCustomAction("*" + locale("ui.maptool.clear"));
refObject.onCustomAction.add((obj, player, actionName) => {
    refObject.clear();
});

// ----------------
// Mark cards going into decks as safe to delete.

// The card is deleted but added to the deck.  Mark safe deletion.
const onInsertedHandler = (deck, insertedCard, position, player) => {
    insertedCard.setTags(["DELETED_ITEMS_IGNORE"]);
    // TODO REMOVE IF/WHEN FIXED
    // For the moment, tags get lost between this event and the
    // globalEvents.onObjectDestroyed for the card.  Also record the
    // NSID as ignore.
    const nsid = ObjectNamespace.getNsid(insertedCard);
    if (nsid && nsid.length > 0) {
        _ignoreNsidSet.add(nsid);
    }
};

globalEvents.TI4.onSingletonCardMadeDeck.add((deck) => {
    deck.onInserted.add(onInsertedHandler);
});

globalEvents.onObjectCreated.add((obj) => {
    if (!(obj instanceof Card)) {
        return;
    }
    // Strange things happen when making a deck.  Wait a frame then see.
    process.nextTick(() => {
        if (obj.getStackSize() > 1) {
            // deck
            obj.onInserted.add(onInsertedHandler);
        }
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (!(obj instanceof Card)) {
            continue;
        }
        if (obj.getStackSize() > 1) {
            obj.onInserted.add(onInsertedHandler);
        }
    }
}
