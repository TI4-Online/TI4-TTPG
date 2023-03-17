const assert = require("../../wrapper/assert-wrapper");
const { CheckDeckUnique } = require("./check-deck-unique");
const { ObjectNamespace } = require("../object-namespace");
const { TableLayout } = require("../../table/table-layout");
const { Card, Rotator, world } = require("../../wrapper/api");

const DECKS = [
    {
        nsidPrefix: "card.objective.public_1",
        parentNsid: "mat:base/objectives_1",
        deckSnapPointIndex: 5,
        discardSnapPointIndex: -1,
    },
    {
        nsidPrefix: "card.objective.public_2",
        parentNsid: "mat:base/objectives_2",
        deckSnapPointIndex: 5,
        discardSnapPointIndex: -1,
    },

    {
        nsidPrefix: "card.action",
        parentNsid: "mat:base/decks",
        deckSnapPointIndex: 3,
        discardSnapPointIndex: 0,
    },
    {
        nsidPrefix: "card.agenda",
        parentNsid: "mat:base/decks",
        deckSnapPointIndex: 4,
        discardSnapPointIndex: 1,
    },
    {
        nsidPrefix: "card.objective.secret",
        parentNsid: "mat:base/decks",
        deckSnapPointIndex: 5,
        discardSnapPointIndex: -1,
    },
    {
        nsidPrefix: "card.planet",
        parentNsid: "mat:base/decks",
        deckSnapPointIndex: 2,
        discardSnapPointIndex: -1,
    },

    {
        nsidPrefix: "card.exploration.cultural",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 8,
        discardSnapPointIndex: 3,
    },
    {
        nsidPrefix: "card.exploration.hazardous",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 7,
        discardSnapPointIndex: 2,
    },
    {
        nsidPrefix: "card.exploration.industrial",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 6,
        discardSnapPointIndex: 1,
    },
    {
        nsidPrefix: "card.exploration.frontier",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 5,
        discardSnapPointIndex: 0,
    },
    {
        nsidPrefix: "card.relic",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 9,
        discardSnapPointIndex: -1,
    },
    {
        nsidPrefix: "card.legendary_planet",
        parentNsid: "mat:pok/exploration",
        deckSnapPointIndex: 4,
        discardSnapPointIndex: -1,
    },
];

// Cache NSID to object lookup.  Maybe this should be a world.TI4 function?
const _nsidToParent = {};

/**
 * Find TI4 deck or discard piles.
 */
class DealDiscard {
    static _getDeckData(nsidOrPrefix) {
        assert(typeof nsidOrPrefix === "string");
        for (const deckData of DECKS) {
            if (nsidOrPrefix.startsWith(deckData.nsidPrefix)) {
                return deckData;
            }
        }
    }
    static _getParent(deckData) {
        const obj = _nsidToParent[deckData.parentNsid];
        if (obj && obj.isValid()) {
            return obj;
        }
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== deckData.parentNsid) {
                continue;
            }
            _nsidToParent[deckData.parentNsid] = obj;
            return obj;
        }
    }
    static _getDeck(nsidOrPrefix, getDiscard) {
        assert(typeof nsidOrPrefix === "string");
        const deckData = DealDiscard._getDeckData(nsidOrPrefix);
        if (!deckData) {
            return;
        }
        const parent = DealDiscard._getParent(deckData);
        if (!parent) {
            return;
        }
        const snapPoints = parent.getAllSnapPoints();
        let index = getDiscard
            ? deckData.discardSnapPointIndex
            : deckData.deckSnapPointIndex;
        if (getDiscard && index === -1) {
            index = deckData.deckSnapPointIndex;
        }
        const snapPoint = snapPoints[index];

        if (index === -1) {
            return; // asked for the discard pile when there is no discard pile
        }
        if (!snapPoint) {
            throw new Error(
                `_getDeck: no snap point [${index}] on "${nsidOrPrefix}"`
            );
        }

        // getSnappedObject isn't reliable.  Try, then fallback to cast.
        let deck = snapPoint.getSnappedObject();
        if (!(deck instanceof Card)) {
            deck = false; // non-card snapped?
        }
        if (deck && deck.isInHolder()) {
            deck = false; // already dealt, but not moved yet
        }
        if (!deck) {
            const pos = snapPoint.getGlobalPosition();
            const src = pos.subtract([0, 0, 50]);
            const dst = pos.add([0, 0, 50]);
            const hits = world.lineTrace(src, dst);
            for (const hit of hits) {
                if (!(hit.object instanceof Card)) {
                    continue; // not a card
                }
                if (hit.object.isInHolder()) {
                    continue; // already dealt, but not moved yet
                }
                deck = hit.object;
                break;
            }
        }

        return deck;
    }

    /**
     * Does this object know about the related deck?
     *
     * @param {string} nsidOrPrefix
     * @returns {boolean} true if known
     */
    static isKnownDeck(nsidOrPrefix) {
        assert(typeof nsidOrPrefix === "string");
        return DealDiscard._getDeckData(nsidOrPrefix) ? true : false;
    }

    /**
     * Get the deck.  Optionally shuffle and merge in the discard pile if
     * too few cards (prior to dealing).
     *
     * @param {string} nsidOrPrefix
     * @param {number|undefined} requireCapacity - need at least N cards
     * @returns {Card|undefined} card, deck, or undefined if missing
     */
    static getDeckWithReshuffle(nsidOrPrefix, requireCapacity = 0) {
        assert(typeof nsidOrPrefix === "string");
        let deck = DealDiscard._getDeck(nsidOrPrefix, false);
        if (deck && deck.getStackSize() >= requireCapacity) {
            return deck;
        }
        // Deck needs more cards.  Shuffle discard, place on bottom.
        const discard = DealDiscard._getDeck(nsidOrPrefix, true);
        if (discard) {
            discard.shuffle();
            if (deck) {
                // Add to existing deck.
                deck.addCards(discard, true);
            } else {
                // Move to deck position.  We know deck data and parent exist.
                const deckData = DealDiscard._getDeckData(nsidOrPrefix);
                const parent = DealDiscard._getParent(deckData);
                const snapPoints = parent.getAllSnapPoints();
                const snapPoint = snapPoints[deckData.deckSnapPointIndex];
                assert(snapPoint);
                const pos = snapPoint.getGlobalPosition().add([0, 0, 10]);
                const yaw = snapPoint.getSnapRotation();
                const rot = new Rotator(0, yaw, 0).compose(
                    parent.getRotation()
                );
                discard.setPosition(pos, 1);
                discard.setRotation(rot, 1);
                discard.snap();
                deck = discard;
            }
        }
        return deck;
    }

    /**
     * Get the discard deck.
     *
     * @param {string} nsidOrPrefix
     * @returns {Card|undefined} card, deck, or undefined if missing
     */
    static getDiscard(nsidOrPrefix) {
        assert(typeof nsidOrPrefix === "string");
        return DealDiscard._getDeck(nsidOrPrefix, true);
    }

    /**
     * Deal card(s) from deck to player slot.
     *
     * @param {string} nsidPrefix
     * @param {number} count
     * @param {number} playerSlot
     * @returns {boolean} true if dealt
     */
    static deal(nsidPrefix, count, playerSlot) {
        assert(typeof nsidPrefix === "string");
        assert(typeof count === "number" && count >= 0);
        assert(typeof playerSlot === "number");

        const deck = DealDiscard.getDeckWithReshuffle(nsidPrefix, count);
        if (!deck) {
            console.log(`deal(${nsidPrefix}, ${count}): missing deck`);
            return false;
        }
        if (deck.getStackSize() < count) {
            console.log(
                `deal(${nsidPrefix}, ${count}): too few cards in deck (${deck.getStackSize()})`
            );
            return false;
        }

        // Move the card elsewhere before dealing so future linecasts trying to
        // find the deck don't find it by accident.
        const faceDown = false; // false = card will be face up in hand
        const dealToAllHolders = true; // needs to be true to deal to other players?
        deck.deal(count, [playerSlot], faceDown, dealToAllHolders);
        return true;
    }

    /**
     * Deal card(s) from deck to position/rotation.
     *
     * @param {string} nsidPrefix
     * @param {number} count
     * @param {Vector} position
     * @param {Rotator} rotation
     * @returns {Card} Card if dealt
     */
    static dealToPosition(nsidPrefix, count, position, rotation) {
        assert(typeof nsidPrefix === "string");
        assert(typeof count === "number" && count >= 0);
        assert(typeof position.x === "number");
        assert(typeof rotation.yaw === "number");

        const deck = DealDiscard.getDeckWithReshuffle(nsidPrefix, count);
        if (!deck) {
            console.log(
                `dealToPosition(${nsidPrefix}, ${count}): missing deck`
            );
            return false;
        }
        if (deck.getStackSize() < count) {
            console.log(
                `dealToPosition(${nsidPrefix}, ${count}): too few cards in deck (${deck.getStackSize()})`
            );
            return false;
        }

        let card;
        if (deck.getStackSize() == 1) {
            card = deck;
        } else {
            const fromFront = false; // "front" is bottom
            const offset = 0;
            const keep = false;
            card = deck.takeCards(count, fromFront, offset, keep);
        }
        card.setPosition(position, 1);
        card.setRotation(rotation, 1);

        return card;
    }

    /**
     * Wait a moment, then join any cards at the location.
     *
     * Saw a case where mass discarding at the end of a draft had a loose
     * card beneath a deck.
     *
     * @param {Vector} pos
     */
    static _delayedMergeDiscards(pos) {
        if (world.__isMock) {
            return;
        }

        // Watch for the discard not fully connecting.  Saw this mass-discarding
        // into an empty spot cleaning a draft.
        const delayedFixDiscard = () => {
            let firstDeck = undefined;
            const traceHits = world.lineTrace(
                [pos.x, pos.y, world.getTableHeight() + 10],
                [pos.x, pos.y, world.getTableHeight() - 10]
            );
            for (const traceHit of traceHits) {
                const card = traceHit.object;
                if (!(card instanceof Card)) {
                    continue;
                }
                if (card.isHeld()) {
                    continue;
                }
                if (firstDeck) {
                    console.log("delayedFixDiscard: merging");
                    card.setTags(["DELETED_ITEMS_IGNORE"]);
                    const toFront = true;
                    const offset = 0;
                    const animate = false;
                    const flipped = false;
                    CheckDeckUnique.checkDeckAfterAddingCard(firstDeck, card);
                    firstDeck.addCards(card, toFront, offset, animate, flipped);
                } else {
                    firstDeck = card;
                }
            }
        };
        setTimeout(delayedFixDiscard, 100);
    }

    /**
     * Discard a card.
     *
     * @param {Card} obj
     * @returns {boolean} true if discarded
     */
    static discard(obj) {
        assert(obj instanceof Card);

        if (obj.isInHolder()) {
            obj.removeFromHolder();
        }

        const nsid = ObjectNamespace.getNsid(obj);

        // Return promissory to player.
        if (nsid.startsWith("card.promissory")) {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const parts = parsed.type.split(".");
            const dst = parts[2];
            // dst is either a color or faction
            const ownerFaction = world.TI4.getFactionByNsidName(dst);
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskSlot = playerDesk.playerSlot;
                const deskFaction = world.TI4.getFactionByPlayerSlot(deskSlot);
                if (
                    (deskFaction && deskFaction === ownerFaction) ||
                    dst === playerDesk.colorName
                ) {
                    const count = 1;
                    const slots = [deskSlot];
                    const faceDown = false;
                    const dealToAllHolders = true;
                    obj.deal(count, slots, faceDown, dealToAllHolders);
                    return true;
                }
            }
        }

        // Return alliance to player.
        if (nsid.startsWith("card.alliance")) {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const factionNsidName = parsed.name.split(".")[0];
            const faction = world.TI4.getFactionByNsidName(factionNsidName);
            if (faction && faction.playerSlot) {
                const count = 1;
                const slots = [faction.playerSlot];
                const faceDown = false;
                const dealToAllHolders = true;
                obj.deal(count, slots, faceDown, dealToAllHolders);
                return true;
            }
        }

        // Move faction reference and token cards back to decks.
        if (
            nsid.startsWith("card.faction_reference") ||
            nsid.startsWith("card.faction_token")
        ) {
            // const parsed = ObjectNamespace.parseNsid(nsid);
            // const type = parsed.type;
            // for (const candidate of world.getAllObjects()) {
            //     if (candidate.getContainer()) {
            //         continue;
            //     }
            //     if (!(candidate instanceof Card)) {
            //         continue;
            //     }
            //     if (candidate.getStackSize() <= 1) {
            //         continue; // look for decks, not cards
            //     }
            //     const nsids = ObjectNamespace.getDeckNsids(candidate);
            //     let found = true;
            //     for (const candidateNsid of nsids) {
            //         if (!candidateNsid.startsWith(type)) {
            //             found = false;
            //             break;
            //         }
            //     }
            //     if (found) {
            //         // All cards in deck are of this type.  Hopefully it is the right one!
            //         obj.setTags(["DELETED_ITEMS_IGNORE"]);
            //         const toFront = true;
            //         const offset = 0;
            //         const animate = true;
            //         const flipped = false;
            //         candidate.addCards(obj, toFront, offset, animate, flipped);
            //         return true;
            //     }

            // Move to a known location (would be better to just make a mat for them).
            let pos;
            if (nsid.startsWith("card.faction_reference")) {
                pos = { x: -26, y: 30, z: 5 };
            } else if (nsid.startsWith("card.faction_token")) {
                pos = { x: -33, y: 30, z: 5 };
            }
            const yaw = 0;
            let rot = new Rotator(0, yaw, 0);

            const anchor = TableLayout.anchor.score;
            pos = TableLayout.anchorPositionToWorld(anchor, pos);
            rot = TableLayout.anchorRotationToWorld(anchor, rot);
            pos.z = world.getTableHeight() + 10;

            DealDiscard._delayedMergeDiscards(pos);

            // Is there already a card there?
            const traceHits = world.lineTrace(
                [pos.x, pos.y, world.getTableHeight() + 10],
                [pos.x, pos.y, world.getTableHeight() - 10]
            );
            for (const traceHit of traceHits) {
                if (traceHit.object instanceof Card) {
                    //console.log("discard: adding to deck");
                    const deck = traceHit.object;
                    obj.setTags(["DELETED_ITEMS_IGNORE"]);
                    const toFront = true;
                    const offset = 0;
                    const animate = false;
                    const flipped = false;
                    CheckDeckUnique.checkDeckAfterAddingCard(deck, obj);
                    deck.addCards(obj, toFront, offset, animate, flipped);
                    return true;
                }
            }

            // No deck, move card.
            //console.log("discard: moving to location");
            obj.setPosition(pos, 0);
            obj.setRotation(rot, 0);
            obj.snapToGround();

            return true;
        }

        if (!DealDiscard.isKnownDeck(nsid)) {
            // Otherwise discard to a known deck.
            return false;
        }

        const deckData = DealDiscard._getDeckData(nsid);
        const getDiscard = deckData.discardSnapPointIndex >= 0;
        let deck = DealDiscard._getDeck(nsid, getDiscard);
        if (deck) {
            // Add to existing discard pile.
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            const toFront = true;
            const offset = 0;
            const animate = true;
            const flipped = false;
            CheckDeckUnique.checkDeckAfterAddingCard(deck, obj);
            deck.addCards(obj, toFront, offset, animate, flipped);
        } else {
            // Start a new discard pile.
            deck = obj;

            // Move to deck position.  We know deck data and parent exist.
            // Careful if discarding to main deck vs discard pile.
            const parent = DealDiscard._getParent(deckData);
            const snapPoints = parent.getAllSnapPoints();
            let index = deckData.discardSnapPointIndex;
            let roll = 180;
            if (index == -1) {
                index = deckData.deckSnapPointIndex;
                roll = 0;
            }
            const snapPoint = snapPoints[index];
            assert(snapPoint);
            const pos = snapPoint.getGlobalPosition().add([0, 0, 5]);
            const yaw = snapPoint.getSnapRotation();
            const rot = new Rotator(0, yaw, roll).compose(parent.getRotation());
            deck.setPosition(pos, 1);
            deck.setRotation(rot, 1);
            deck.snap();
        }

        // If discards go to the main deck, shuffle after discarding.
        if (!getDiscard) {
            // Wait until the card get added to shuffle, otherwise the added
            // card is on the bottom.
            if (obj !== deck) {
                obj.onDestroyed.add(() => {
                    process.nextTick(() => {
                        deck.shuffle();
                    });
                });
            }
        }

        return true;
    }
}

module.exports = { DealDiscard, DECKS };
