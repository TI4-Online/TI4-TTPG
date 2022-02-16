const assert = require("../wrapper/assert-wrapper");
const { Card, GameObject } = require("../wrapper/api");

/**
 * Test and parse GameObject.getTemplateMetadata() namespace.
 * Objects use a 'type:source/name' namespace, e.g.:
 *
 * 'card.objective.secret:base/cut_supply_lines'
 *
 * As convention call these "nsid" to distinguish from "guid",
 * "template id", etc to know this is the kind of string in hand.
 *
 * See https://github.com/TI4-Online/TI4-TTPG/wiki/NSID-Namespace
 */
class ObjectNamespace {
    /**
     * Static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Parse a 'type:source/name' string into components.
     *
     * @param {GameObject} obj
     * @returns {{ type : string, source : string, name : string}}
     */
    static parseNsid(nsid) {
        assert(typeof nsid === "string");
        const m = nsid.match(/^([^:]+):([^/]+)\/(.+)$/);
        return m && { type: m[1], source: m[2], name: m[3] };
    }

    /**
     * Get the NSID from an object.
     *
     * @param {GameObject} obj
     * @returns {string}
     */
    static getNsid(obj) {
        assert(obj instanceof GameObject);
        if (obj instanceof Card) {
            if (obj.getStackSize() == 1) {
                return obj.getCardDetails().metadata;
            } else {
                // This is a deck.  Treat as anonymous.
                return "";
            }
        }
        return obj.getTemplateMetadata();
    }

    /**
     * Get card NSIDs from a deck, in deck order.
     *
     * @param {GameObject} obj
     * @returns {Array.{string}}
     */
    static getDeckNsids(obj) {
        assert(obj instanceof Card);
        return obj
            .getAllCardDetails()
            .map((cardDetails) => cardDetails.metadata);
    }

    /**
     * Is the object of this generic type?
     *
     * @param {GameObject} obj
     * @param {string} type
     * @returns {boolean}
     */
    static isGenericType(obj, type) {
        assert(typeof type === "string");
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith(type);
    }

    /**
     * Parse object NSID into components.
     *
     * @param {GameObject} obj
     * @returns {{ type : string, source : string, name : string}}
     */
    static parseGeneric(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return ObjectNamespace.parseNsid(nsid);
    }

    /**
     * Get the generic object namespace "type" string.
     *
     * Filtering cards is probably examining a lot of objects.  Caller should
     * get the card type once, then `isGenericType` for faster checking.
     *
     * @param {string} deck - deck name
     * @returns {string} ObjectNamespace type
     */
    static getCardType(deck) {
        return "card." + deck;
    }

    static isCard(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("card");
    }

    static parseCard(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.deck = result.type.substring("card.".length);
        }
        return result;
    }

    static isCommandSheet(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid === "sheet:base/command";
    }

    static isCommandToken(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("token.command");
    }

    static isCommandTokenBag(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("bag.token.command");
    }

    static parseCommandToken(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.faction = result.name;
        }
        return result;
    }

    static isControlToken(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("token.control");
    }

    static parseControlToken(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.faction = result.name;
        }
        return result;
    }

    static isFactionSheet(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("sheet.faction");
    }

    static parseFactionSheet(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.faction = result.name;
        }
        return result;
    }

    static isStrategyCard(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("tile.strategy");
    }

    static parseStrategyCard(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.card = result.name.split(".")[0]; // .omega
        }
        return result;
    }

    static isSystemTile(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("tile.system");
    }

    static parseSystemTile(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.tile = Number.parseInt(result.name);
        }
        return result;
    }

    static isToken(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("token");
    }

    static parseToken(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.token = result.name.split(".")[0]; // tear tokens
        }
        return result;
    }

    static isTokenBag(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("bag.token");
    }

    static parseTokenBag(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.token = result.name.split(".")[0]; // tear tokens
        }
        return result;
    }

    static isUnit(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("unit");
    }

    static parseUnit(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.unit = result.name; // reserve should something change
        }
        return result;
    }

    static isUnitBag(obj) {
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("bag.unit");
    }

    static parseUnitBag(obj) {
        const result = ObjectNamespace.parseGeneric(obj);
        if (result) {
            result.unit = result.name; // reserve should something change
        }
        return result;
    }
}

module.exports = { ObjectNamespace };
