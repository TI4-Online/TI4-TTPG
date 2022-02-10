const assert = require("../wrapper/assert-wrapper");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerDesk } = require("../lib/player-desk");
const { Spawn } = require("./spawn/spawn");
const {
    Card,
    CardHolder,
    ObjectType,
    Rotator,
    world,
} = require("../wrapper/api");

/**
 * Base class with some shared helper methods.
 */
class AbstractSetup {
    constructor() {
        this._playerDesk = false;
    }

    get playerDesk() {
        return this._playerDesk;
    }

    setPlayerDesk(playerDesk) {
        assert(playerDesk instanceof PlayerDesk);
        this._playerDesk = playerDesk;
        return this;
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
            if (parsedNsid.source.startsWith("homebrew")) {
                return false; // ignore homebrew
            }
            if (parsedNsid.source.startsWith("franken")) {
                return false; // ignore franken
            }
            return parsedNsid.type.startsWith(nsidPrefix);
        });
        mergeDeckNsids.sort();

        // Spawn the decks, combine into one.
        let deck = false;
        mergeDeckNsids.forEach((mergeDeckNsid) => {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (deck) {
                deck.addCards(mergeDeck);
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
                cardObj.destroy();
            }
        }

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([deck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });

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
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (
                ObjectNamespace.getNsid(obj) === nsid &&
                obj.getOwningPlayerSlot() === ownerSlot
            ) {
                return obj;
            }
        }
    }

    /**
     * Split a deck ("Card" with multiple cards) into indivudual card objects.
     *
     * @param {Card} deck
     * @returns {Array.{Card}}
     */
    separateCards(deck) {
        assert(deck instanceof Card);

        const result = [];
        while (deck.getStackSize() > 1) {
            result.push(deck.takeCards(1, true, 1));
        }
        result.push(deck);
        return result;
    }

    /**
     * Move each card into desk's card holder.
     *
     * @param {Card} deck
     */
    moveToCardHolder(deck) {
        assert(deck instanceof Card);
        assert(this.playerDesk);

        let hand = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (
                obj instanceof CardHolder &&
                obj.getOwningPlayerSlot() === this.playerDesk.playerSlot
            ) {
                hand = obj;
                break;
            }
        }
        if (!hand) {
            // No hand, abort.
            return false;
        }

        const cards = this.separateCards(deck);
        for (const card of cards) {
            if (!card.isFaceUp()) {
                const rot = new Rotator(0, 0, 180).compose(card.getRotation());
                card.setRotation(rot);
            }

            const index = hand.getNumCards();
            hand.insert(card, index);
        }
    }

    spawnTokensAndBag(tokenData) {
        const pos = this.playerDesk.localPositionToWorld(tokenData.bagPos);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;

        // Spawn bag.
        const bagNsid = tokenData.bagNsid;
        let bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setPrimaryColor(color);
        bag.setOwningPlayerSlot(playerSlot);

        // Bag needs to have the correct type at create time.  If not infinite, fix and respawn.
        if (bag.getType() !== tokenData.bagType) {
            bag.setType(tokenData.bagType);
            const json = bag.toJSONString();
            bag.destroy();
            bag = world.createObjectFromJSON(json, pos);
            bag.setRotation(rot);
        }

        const tokenNsid = `${tokenData.tokenNsidType}:${this._faction.raw.source}/${this._faction.raw.faction}`;
        const above = pos.add([0, 0, 10]);
        for (let i = 0; i < tokenData.tokenCount; i++) {
            const token = Spawn.spawn(tokenNsid, above, rot);
            token.setPrimaryColor(color);
            token.setOwningPlayerSlot(playerSlot);
            bag.addObjects([token]);
        }

        return bag;
    }
}

module.exports = { AbstractSetup };
