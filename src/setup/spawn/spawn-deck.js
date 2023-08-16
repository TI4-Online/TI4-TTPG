const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ReplaceObjects } = require("./replace-objects");
const { Spawn } = require("./spawn");
const { Card, world } = require("../../wrapper/api");

/**
 * Create decks, potentially merging several partial decks.
 *
 * Also supports filtering down to a subset (or single!) card, as well as
 * applying replacement rules (e.g. Codex override).
 */
class SpawnDeck {
    /**
     * Spawn a single deck combining all decks matching the nsidPrefix.
     * The apply the filter to restrict to only the desired cards.
     * Applies replacement rules (omega) automatically, and joins with
     * any existing deck already at the destination.
     *
     * @param {string} nsidPrefix
     * @param {Vector} pos - world space
     * @param {Rotator} rot - world space
     * @param {function | undefined} filterNsid
     */
    static spawnDeck(nsidPrefix, pos, rot, filterNsid) {
        assert(typeof nsidPrefix === "string");
        assert(typeof pos.x === "number"); // "instanceof Vector" broken
        assert(typeof rot.yaw === "number"); // "instanceof Rotator" broken
        assert(!filterNsid || typeof filterNsid === "function");

        // Get matching deck NSIDs.
        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            return parsedNsid.type.startsWith(nsidPrefix);
        });
        mergeDeckNsids.sort();

        // Spawn, combine into one.
        let deck = false;
        for (const mergeDeckNsid of mergeDeckNsids) {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (!mergeDeck) {
                throw new Error(
                    `SpawnDeck.spawnDeck: missing "${mergeDeckNsid}"`
                );
            }
            if (deck) {
                mergeDeck.setTags(["DELETED_ITEMS_IGNORE"]);
                const success = deck.addCards(mergeDeck);
                if (!success) {
                    console.log(
                        "SpawnDeck.spawnDeck: addCards failed, is a deck the wrong size?"
                    );
                }
            } else {
                deck = mergeDeck;
            }
        }

        // Remove any filter-rejected cards.
        // Cards in a deck are not objects, pull them out.
        if (filterNsid) {
            const cardNsids = ObjectNamespace.getDeckNsids(deck);
            for (let i = cardNsids.length - 1; i >= 0; i--) {
                const cardNsid = cardNsids[i];
                if (!filterNsid(cardNsid)) {
                    let cardObj;
                    if (deck.getStackSize() > 1) {
                        //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                        cardObj = deck.takeCards(1, true, i);
                    } else {
                        cardObj = deck; // cannot takeCards final card
                        deck = undefined;
                    }
                    assert(cardObj instanceof Card);
                    cardObj.setTags(["DELETED_ITEMS_IGNORE"]);
                    cardObj.destroy();
                }
            }
            if (!deck) {
                return undefined; // unexpected, but legal
            }
        }

        // Apply replacement rules ("x.omega") AFTER game is set up.
        if (world.TI4.config.timestamp > 0) {
            ReplaceObjects.removeReplacedObjects([deck]);
        }

        // Add to existing generic tech deck.
        const existingDeck = SpawnDeck.getDeckAtPosition(nsidPrefix, pos);
        if (existingDeck) {
            existingDeck.addCards(deck);
            deck = existingDeck;
        }

        return deck;
    }

    /**
     * Look for a matching card or deck at the location.
     *
     * @param {string} nsidPrefix
     * @param {Vector} pos
     * @returns {Card | undefined}
     */
    static getDeckAtPosition(nsidPrefix, pos) {
        assert(typeof nsidPrefix === "string");
        assert(typeof pos.x === "number"); // "instanceof Vector" broken

        // Find existing deck to join.  Dropping a new deck on top only
        // creates a stack of two decks; TTPG does not auto-join.
        const start = pos.add([0, 0, 20]);
        const end = pos.subtract([0, 0, 20]);
        const traceHits = world.lineTrace(start, end);
        for (const traceHit of traceHits) {
            // Only want cards or decks.
            if (!(traceHit.object instanceof Card)) {
                continue;
            }

            // ObjectNamespace.getNsid intentionally returns nothing for decks
            // because there are many nsids inside.  Look at first of those.
            const nsid = ObjectNamespace.getDeckNsids(traceHit.object)[0];
            if (!nsid.startsWith(nsidPrefix)) {
                continue;
            }

            // Found card or deck matching desired prefix.
            return traceHit.object;
        }
        return undefined;
    }
}

module.exports = { SpawnDeck };
