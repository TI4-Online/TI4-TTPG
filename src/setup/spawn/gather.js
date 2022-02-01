const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert");
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
    static gather(filterNsid) {
        assert(typeof filterNsid === "function");

        const result = [];
        for (const obj of world.getAllObjects()) {
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
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
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

    static isGenericTechCardNsid(nsid) {
        // "card.technology.red", "card.technology.red.muatt"
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        const typeParts = parsed.type.split(".");
        if (typeParts[0] !== "card" || typeParts[1] !== "technology") {
            return false; // not a technology card
        }
        return typeParts.length < 4;
    }

    static gatherGenericTechDeck() {
        const cards = Gather.gather(Gather.isGenericTechCardNsid);
        const deck = Gather.makeDeck(cards);
        deck.setName(locale("deck.technology"));
        return deck;
    }

    static isFactionTechCardNsid(nsid) {
        // "card.technology.red", "card.technology.red.muatt"
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        const typeParts = parsed.type.split(".");
        if (typeParts[0] !== "card" || typeParts[1] !== "technology") {
            return false; // not a technology card
        }
        return typeParts.length > 3 ? typeParts[3] : false;
    }

    static gatherFactionTechDeck(faction) {
        const cards = Gather.gather((nsid) => {
            Gather.isFactionTechCardNsid(nsid) === faction;
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
            return false; // not a technology card
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
        if (!parsed) {
            return false; // does not have an NSID
        }
        return parsed.type === "unit" || parsed.type === "bag.unit";
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
            "token.exploration.attachment",
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
        if (!parsed) {
            return false; // does not have an NSID
        }
        if (parsed.type !== "sheet") {
            return false;
        }
        return coreSheetNameSet.has(parsed.name);
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
        if (!parsed) {
            return false; // does not have an NSID
        }
        return parsed.type === "tile.system";
    }

    static gatherSystemTiles() {
        return Gather.gather(Gather.isSystemTile);
    }

    static isStrategyCard(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return false; // does not have an NSID
        }
        return parsed.type === "tile.strategy";
    }

    static gatherStrategyCards() {
        return Gather.gather(Gather.isStrategyCard);
    }

    static gatherFactionObjects() {
        const factions = new Set([
            "arborec",
            "argent",
            "creuss",
            "empyrean",
            "hacan",
            "jolnar",
            "l1z1x",
            "letnev",
            "mahact",
            "mentak",
            "muaat",
            "norr",
            "naalu",
            "naazrokha",
            "nekro",
            "nomad",
            "saar",
            "sol",
            "ul",
            "vuilraith",
            "winnu",
            "xxcha",
            "yin",
            "yssaril",
        ]);
        const factionToObjects = {};

        // Tech

        // Promissory

        // Leaders

        // Alliance

        // Planet cards

        // Home system tile

        // Command + Control tokens

        // Faction sheet
    }
}

module.exports = { Gather };
