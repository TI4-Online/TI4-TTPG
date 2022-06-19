const assert = require("../../wrapper/assert-wrapper");
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

/**
 * Cards entering decks get an onObjectDestroyed event.
 * Wait a frame, if the card is in a deck drop it.
 *
 * @param {Card} card
 */
function delayedProcessCard(cardNsid, cardJson) {
    assert(typeof cardNsid === "string");
    assert(typeof cardJson === "string");

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!(obj instanceof Card)) {
            continue;
        }
        // Look for nsid anywhere in stack (might be singleton).
        const deckNsids = ObjectNamespace.getDeckNsids(obj);
        for (const deckNsid of deckNsids) {
            if (deckNsid === cardNsid) {
                return; // found a copy somewhere, ignore this destroy
            }
        }
    }

    // If we get here card is missing.  Add a copy to self.
    const pos = refObject.getPosition().add([0, 0, 10]);
    const clone = world.createObjectFromJSON(cardJson, pos);
    refObject.addObjects([clone]);
}

globalEvents.onObjectDestroyed.add((obj) => {
    if (obj === refObject || obj.getContainer() === refObject) {
        return;
    }
    if (obj.getTags().includes(IGNORE_TAG)) {
        return;
    }
    const nsid = ObjectNamespace.getNsid(obj);
    if (IGNORE_SET.has(nsid)) {
        return;
    }
    if (nsid.startsWith("token.control:")) {
        return;
    }

    // This should no longer be needed, all setup should use deleted items ignore.
    //if (world.TI4.config.timestamp <= 0) {
    //    return; // not set up yet
    //}

    if (refObject.getNumItems() >= refObject.getMaxItems()) {
        // Stop when full.  Could destroy oldest.
        return;
    }

    const json = obj.toJSONString();
    if (json.length === 0) {
        return; // can happen if object is destroyed on same frame it was created?
    }

    // Cards moving into decks get destroyed.  Using onInserted to detect this
    // does not appear to always work, instead wait a frame and check if the
    // card exists before getting destroy treatment.
    if (obj instanceof Card && obj.getStackSize() === 1) {
        process.nextTick(() => {
            delayedProcessCard(nsid, json);
        });
        return;
    }

    const pos = refObject.getPosition().add([0, 0, 10]);
    const clone = world.createObjectFromJSON(json, pos);
    refObject.addObjects([clone]);
});
