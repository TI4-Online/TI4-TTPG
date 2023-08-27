const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { Card, Container, world } = require("../../wrapper/api");

/**
 * There have been two observed instances of a deck doubling, presumably after
 * discarding a card via graveyard.  Because every card has a unique NSID look
 * for problems and fix them.  (Players may clone cards, but those aren't
 * being discarded.)
 */
class CheckDeckUnique {
    static checkDeckAfterAddingCard(deck, card) {
        assert(deck instanceof Card);
        assert(card instanceof Card);

        // Suppress multiple calls on the same deck, same frame.
        if (deck.__CheckDeckUniqueProcessPending) {
            return;
        }
        deck.__CheckDeckUniqueProcessPending = true;

        // If animating it may take a few frames before adding the card.
        // Wait for the card to be consumed, then check next frame.
        assert(card.isValid());
        card.onDestroyed.add(() => {
            process.nextTick(() => {
                delete deck.__CheckDeckUniqueProcessPending;
                CheckDeckUnique.process(deck);
            });
        });
    }

    static process(deck) {
        assert(deck instanceof Card);

        if (!deck.isValid()) {
            console.log(
                "CheckDeckUnique.process: deck no longer valid, aborting"
            );
            return;
        }

        const nsids = ObjectNamespace.getDeckNsids(deck).filter(
            (nsid) => nsid.length > 0
        );
        if (nsids.length === 0) {
            console.log("CheckDeckUnique.process: no nsids, aborting");
            return;
        }

        const seen = new Set();
        const dups = new Set();
        const typeToCount = {};
        const nsidToFirstIndex = {};
        const firstIndexList = [];
        nsids.forEach((nsid, index) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const deckType = parsed.type || "?"; // "card.promissory:..."
            typeToCount[deckType] = (typeToCount[deckType] || 0) + 1;
            if (seen.has(nsid)) {
                dups.add(nsid);
            } else {
                seen.add(nsid);
            }
            // Track the first appearance of each card.
            if (nsidToFirstIndex[nsid] === undefined) {
                nsidToFirstIndex[nsid] = index;
            }
            firstIndexList.push(nsidToFirstIndex[nsid]);
        });

        // Expect no duplicates, exit gracefully.
        if (dups.size === 0) {
            //console.log("CheckDeckUnique.process: no duplicates");
            return;
        }

        // Duplicates found.  Always log when this happens to measure scope.
        const msg = [
            `CheckDeckUnique.process:`,
            `found ${dups.size} duplicates in deck of ${seen.size} unique nsids.`,
            `Card types: ${JSON.stringify(typeToCount)}`,
            `First index list: ${firstIndexList.join(",")}`,
        ].join("\n");
        world.TI4.errorReporting.error(msg);

        // Get individual cards.
        const cards = world.TI4.CardUtil.separateDeck(deck);

        // Pull out duplicates.
        const firstNsids = new Set();
        const firstOfEachCards = [];
        const duplicateCards = [];
        for (const card of cards) {
            const nsid = ObjectNamespace.getNsid(card);
            if (firstNsids.has(nsid)) {
                duplicateCards.push(card);
            } else {
                firstOfEachCards.push(card);
                firstNsids.add(nsid);
            }
        }

        // Reassemble deck.
        deck = world.TI4.CardUtil.makeDeck(firstOfEachCards);
        const duplicatesDeck = world.TI4.CardUtil.makeDeck(duplicateCards);

        // Add to deleted items container.  Do this manually because it will
        // discard them when finding copies.
        let deletedItems = undefined;
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            if (!(obj instanceof Container)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "bag:base/deleted_items") {
                deletedItems = obj;
                break;
            }
        }

        if (deletedItems) {
            console.log(
                `CheckDeckUnique.process: placing deck |${duplicatesDeck.getStackSize()}| in deleted items`
            );
            const index = 0;
            const showAnimation = false;
            deletedItems.addObjects([duplicatesDeck], index, showAnimation);
        } else {
            // No container?  Just remove the duplicates.
            console.log(
                "CheckDeckUnique.process: no deleted items bag, destroying duplicates"
            );
            duplicatesDeck.destroy();
        }
    }
}

module.exports = { CheckDeckUnique };
