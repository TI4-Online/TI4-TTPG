const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, world } = require("../../wrapper/api");

/**
 * After spawning objects, gather together those for a generic player setup.
 */
class Gather {
    static sortByNsid(objs) {
        return objs.sort((a, b) => {
            a = ObjectNamespace.parseGeneric(a);
            b = ObjectNamespace.parseGeneric(b);
            if (a.type != b.type) {
                return a.type < b.type ? -1 : 1;
            }
            if (a.name != b.name) {
                return a.name < b.name ? -1 : 1;
            }
            if (a.source != b.source) {
                return a.source < b.source ? -1 : 1;
            }
            return 0;
        });
    }

    /**
     * Scan objects on the table, get matching objects.
     * Will look inside decks and extract card objects.
     *
     * @param {function} filterNsid
     * @returns {Array.{GameObject}}
     */
    static gather(filterNsid, objs) {
        assert(typeof filterNsid === "function");
        if (!objs) {
            objs = world.getAllObjects();
        }

        const result = [];
        for (const obj of objs) {
            if (obj.getContainer()) {
                continue; // only scan on-table objects
            }

            if (obj instanceof Card && obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    if (filterNsid(nsid)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
                        assert(cardObj instanceof Card);
                        result.push(cardObj);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                if (filterNsid(nsid)) {
                    result.push(obj);
                }
            }
        }
        return Gather.sortByNsid(result);
    }

    static makeDeck(cardObjects) {
        assert(Array.isArray(cardObjects));
        assert(cardObjects.length > 0);
        const deckObject = cardObjects.pop();
        assert(deckObject instanceof Card);
        for (const cardObject of cardObjects) {
            deckObject.addCards(cardObject);
        }
        return deckObject; // stack, might be only one card, or even undefined if empty array
    }

    static parseNextTypePart(nsid, requiredTypeParts, returnTypePartIndex) {
        assert(typeof nsid === "string");
        assert(Array.isArray(requiredTypeParts));

        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // not an NSID
        }
        const typeParts = parsed.type.split(".");
        for (let i = 0; i < requiredTypeParts.length; i++) {
            if (typeParts[i] !== requiredTypeParts[i]) {
                return false; // type part mimatch
            }
        }
        return typeParts[returnTypePartIndex];
    }

    static isGenericTechCardNsid(nsid) {
        return (
            Gather.parseNextTypePart(nsid, ["card", "technology"], 2) &&
            !Gather.isFactionTechCardNsid(nsid)
        );
    }

    static gatherGenericTechDeck() {
        const cards = Gather.gather(Gather.isGenericTechCardNsid);
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck.technology"));
        return deck;
    }

    static isFactionTechCardNsid(nsid) {
        // "card.technology.red", "card.technology.red.muaat"
        return Gather.parseNextTypePart(nsid, ["card", "technology"], 3);
    }

    static gatherFactionTechDeck(faction) {
        assert(typeof faction === "string");
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionTechCardNsid(nsid) === faction;
        });
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck.technology"));
        return deck;
    }

    static isCardNsid(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        const typeParts = parsed.type.split(".");
        if (typeParts[0] !== "card") {
            return false; // not a card
        }
        return typeParts.slice(1).join(".");
    }

    static gatherDeck(deckName) {
        assert(typeof deckName === "string");
        const cards = Gather.gather(
            (nsid) => Gather.isCardNsid(nsid) === deckName
        );
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck." + deckName));
        return deck;
    }

    static isUnitOrUnitBag(nsid) {
        // "unit:base/fighter", "bag.unit:base/fighter"
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed) {
            return parsed.type === "unit" || parsed.type === "bag.unit";
        }
    }

    static gatherUnitsAndUnitBags() {
        return Gather.gather(Gather.isUnitOrUnitBag);
    }

    static isCoreTokenOrTokenBag(nsid) {
        // "token:base/fighter_1", "bag.token:base/fighter_1"
        const coreTokenNameSet = new Set([
            "fighter_1",
            "fighter_3",
            "infantry_1",
            "infantry_3",
            "tradegood_commodity_1",
            "tradegood_commodity_3",
        ]);
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        if (parsed.type !== "token" && parsed.type !== "bag.token") {
            return false;
        }
        return coreTokenNameSet.has(parsed.name);
    }

    static gatherCoreTokenAndTokenBags() {
        return Gather.gather(Gather.isCoreTokenOrTokenBag);
    }

    static isTableTokenOrTokenBag(nsid) {
        // "token:base/fighter_1", "bag.token:base/fighter_1"
        const typeSet = new Set([
            "token.exploration",
            "token.attachment.exploration",
            "token.wormhole.exploration",
        ]);
        const nameSet = new Set(["frontier"]);
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        if (parsed.type.startsWith("token")) {
            if (typeSet.has(parsed.type)) {
                return true;
            }
            if (nameSet.has(parsed.name)) {
                return true;
            }
        } else if (parsed.type.startsWith("bag")) {
            if (nameSet.has(parsed.name)) {
                return true;
            }
        }
        return false;
    }

    static gatherTableTokenAndTokenBags() {
        return Gather.gather(Gather.isTableTokenOrTokenBag);
    }

    static isCoreSheet(nsid) {
        const coreSheetNameSet = new Set(["command", "leader"]);
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed && parsed.type === "sheet") {
            return coreSheetNameSet.has(parsed.name);
        }
    }

    static gatherSheets() {
        const lookFor = new Set(["sheet:base/command", "sheet:pok/leader"]);

        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (lookFor.has(nsid)) {
                result.push(obj);
            }
        }
        return result;
    }

    static isSystemTile(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed) {
            return parsed.type === "tile.system";
        }
    }

    static gatherSystemTiles() {
        return Gather.gather(Gather.isSystemTile);
    }

    static isStrategyCard(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed) {
            return parsed.type === "tile.strategy";
        }
    }

    static gatherStrategyCards() {
        return Gather.gather(Gather.isStrategyCard);
    }

    static isFactionPromissoryNsid(nsid) {
        // careful, this can also return a color instead of a faction name for those notes
        return Gather.parseNextTypePart(nsid, ["card", "promissory"], 2);
    }

    static gatherFactionPromissoryDeck(faction) {
        assert(typeof faction === "string");
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionPromissoryNsid(nsid) === faction;
        });
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck.promissory"));
        return deck;
    }

    static isFactionLeaderNsid(nsid) {
        return Gather.parseNextTypePart(nsid, ["card", "leader"], 3);
    }

    static gatherFactionLeadersDeck(faction) {
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionLeaderNsid(nsid) === faction;
        });
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck.leader"));
        return deck;
    }

    static isFactionAlliance(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed && parsed.type === "card.alliance") {
            return parsed.name;
        }
    }

    static gatherFactionAllainceCard(faction) {
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionAlliance(nsid) === faction;
        });
        assert(cards.length === 1);
        cards[0].setName("");
        return cards[0];
    }

    static isFactionReference(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed && parsed.type === "card.faction_reference") {
            return parsed.name;
        }
    }

    static gatherFactionReferenceCard(faction) {
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionReference(nsid) === faction;
        });
        assert(cards.length === 1);
        return cards[0];
    }

    static isFactionTokenCard(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (parsed && parsed.type === "card.faction_token") {
            return parsed.name;
        }
    }

    static gatherFactionTokenCard(faction) {
        const cards = Gather.gather((nsid) => {
            return Gather.isFactionTokenCard(nsid) === faction;
        });
        assert(cards.length === 1);
        return cards[0];
    }

    static isFactionToken(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false;
        }
        // Command and control.
        if (
            parsed.type === "token.command" ||
            parsed.type === "token.control"
        ) {
            return parsed.name;
        }
        // Other tokens (dimensional tear, etc)
        if (parsed.type.startsWith("token")) {
            const typeParts = parsed.type.split(".");
            const last = typeParts[typeParts.length - 1];
            return last; // sloppy, assumes factions do not use reserved names
        }
    }

    static gatherFactionTokens(faction) {
        const result = Gather.gather(
            (nsid) => Gather.isFactionToken(nsid) === faction
        );
        assert(result.length >= 2);
        return result;
    }

    // Faction sheet
}

module.exports = { Gather };
