const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Spawn } = require("./spawn/spawn");
const { Card, Vector, world } = require("../wrapper/api");

/**
 * Base class with some shared helper methods.
 *
 * Subclasses must implement "setup" and "clean".
 */
class AbstractSetup {
    static getCrateAreaLocalPosition(index) {
        assert(typeof index === "number");

        const NUM_CRATES = 5;
        const distanceBetweenCrates = 9.2; // 11.5 * crate scale
        const totalWidth = (NUM_CRATES - 1) * distanceBetweenCrates;
        const x0 = -totalWidth / 2;
        const localPos = new Vector(50, x0 + index * distanceBetweenCrates, 0);
        return localPos;
    }

    /**
     * Constructor.
     *
     * @param {PlayerDesk} optional playerDesk
     * @param {Faction} optional faction
     */
    constructor(playerDesk, faction) {
        this._playerDesk = playerDesk;
        this._faction = faction;
    }

    /**
     * Linked player desk.
     *
     * @returns {PlayerDesk|undefined}
     */
    get playerDesk() {
        return this._playerDesk;
    }

    /**
     * Linked faction.
     */
    get faction() {
        return this._faction;
    }

    /**
     * Verify the nsid matches the needed prefix, return the type component
     * (index of '.' delimited type strings).
     *
     * @param {string} nsid
     * @param {Array.{string}} requiredTypeParts
     * @param {number} returnTypePartIndex
     * @returns {string}
     */
    parseNsidGetTypePart(nsid, requiredTypePrefix, returnTypePartIndex) {
        assert(typeof nsid === "string");
        assert(typeof requiredTypePrefix === "string");
        assert(typeof returnTypePartIndex === "number");

        if (!nsid.startsWith(requiredTypePrefix)) {
            return false;
        }
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // not an NSID
        }
        const typeParts = parsed.type.split(".");
        return typeParts[returnTypePartIndex];
    }

    /**
     * Spawn a single deck combining all decks matching the nsidPrefix.
     * The apply the filter to restrict to only the desired cards.
     * Applies replacement rules (omega) automatically, and joins with
     * any existing deck already at the destination.
     *
     * @param {Vector} pos - world space
     * @param {Rotator} rot - world space
     * @param {string} nsidPrefix
     * @param {function} filterNsid
     */
    spawnDecksThenFilter(pos, rot, nsidPrefix, filterNsid) {
        assert(typeof pos.x === "number"); // "instanceof Vector" broken
        assert(typeof rot.yaw === "number"); // "instanceof Rotator" broken
        assert(typeof nsidPrefix === "string");
        assert(typeof filterNsid === "function");

        // Find existing deck to join.  Dropping a new deck on top only
        // creates a stack of two decks; TTPG does not auto-join.
        const start = pos.add([0, 0, 20]);
        const end = pos.subtract([0, 0, 20]);
        const traceHit = world.lineTrace(start, end).find((traceHit) => {
            if (!(traceHit.object instanceof Card)) {
                return false; // only looking for decks
            }
            // ObjectNamespace.getNsid intentionally returns nothing for decks
            // because there are many nsids inside.  Look at first of those.
            const nsid = ObjectNamespace.getDeckNsids(traceHit.object)[0];
            return nsid.startsWith(nsidPrefix);
        });
        const existingDeck = traceHit && traceHit.object;

        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            return parsedNsid.type.startsWith(nsidPrefix);
        });
        mergeDeckNsids.sort();

        // Spawn the decks, combine into one.
        let deck = false;
        mergeDeckNsids.forEach((mergeDeckNsid) => {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (deck) {
                mergeDeck.setTags(["DELETED_ITEMS_IGNORE"]);
                const success = deck.addCards(mergeDeck);
                if (!success) {
                    console.log(
                        "spawnDecksThenFilter: addCards failed, is a deck the wrong size?"
                    );
                }
            } else {
                deck = mergeDeck;
            }
        });

        // Remove any filter-rejected cards.
        // Cards in a deck are not objects, pull them out.
        const cardNsids = ObjectNamespace.getDeckNsids(deck);
        for (let i = cardNsids.length - 1; i >= 0; i--) {
            const cardNsid = cardNsids[i];
            if (!filterNsid(cardNsid)) {
                let cardObj;
                if (deck.getStackSize() > 1) {
                    //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                    cardObj = deck.takeCards(1, true, i);
                } else {
                    cardObj = deck; // cannot take final card
                }
                assert(cardObj instanceof Card);
                cardObj.setTags(["DELETED_ITEMS_IGNORE"]);
                cardObj.destroy();
            }
        }

        // Apply replacement rules ("x.omega") AFTER game is set up.
        if (world.TI4.config.timestamp > 0) {
            ReplaceObjects.removeReplacedObjects([deck]);
        }

        // Add to existing generic tech deck.
        if (existingDeck) {
            existingDeck.addCards(deck);
            deck = existingDeck;
        }

        return deck;
    }

    /**
     * Find an object with the given NSID with the same owner as the player desk.
     * Useful for command/leader sheet lookup.
     *
     * @param {string} nsid
     * @returns {GameObject}
     */
    findObjectOwnedByPlayerDesk(nsid) {
        assert(typeof nsid === "string");

        const ownerSlot = this.playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (
                !obj.getContainer() &&
                obj.getOwningPlayerSlot() === ownerSlot &&
                ObjectNamespace.getNsid(obj) === nsid
            ) {
                return obj;
            }
        }
    }
}

module.exports = { AbstractSetup };
