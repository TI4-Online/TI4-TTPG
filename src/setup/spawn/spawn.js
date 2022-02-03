const assert = require("../../wrapper/assert");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Rotator, Vector, world } = require("../../wrapper/api");

const NSID_TO_TEMPLATE = {};
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-bag-token.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-bag-unit.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-card.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-sheet.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-tile-strategy.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-tile-system.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-token.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-unit.json"));

// The "NSID" in NSID_TO_TEMPLATE is normally a reasonable group name, the
// prefix for releated objects.  In some cases we want to group earlier,
// such as merging technology.color into an overall technology deck.
const OVERRIDE_GROUP_NSIDS = ["card.technology"];

/**
 * Spawn game objects from the hard-coded template json files.
 * This is intended to dump raw objects on an empty table as the first
 * step of (manual) setup.
 */
class Spawn {
    static getAllNSIDs() {
        return Object.keys(NSID_TO_TEMPLATE);
    }

    /**
     * Get the "group" for an object, mostly for cards -> deck.
     *
     * @param {*} nsid
     * @returns {string}
     */
    static getGroupName(nsid) {
        // Use OVERRIDE_GROUP_NSIDS when matches.
        for (const groupName of OVERRIDE_GROUP_NSIDS) {
            if (nsid.startsWith(groupName)) {
                return groupName;
            }
        }

        // Could remember this, but not called during normal play.
        const typeSet = new Set();
        for (const nsid of Object.keys(NSID_TO_TEMPLATE)) {
            const parsed = ObjectNamespace.parseNsid(nsid);
            typeSet.add(parsed.type);
        }

        // Failing that, use the most-specific of the template types.
        let groupName = false;
        for (const candidateType of typeSet.keys()) {
            if (nsid.startsWith(candidateType)) {
                if (!groupName || groupName.length < candidateType.length) {
                    groupName = candidateType;
                }
            }
        }
        assert(groupName);
        return groupName;
    }

    /**
     * Group nsids by `getGroupName` value.
     * This is useful for merging decks split across multiple templates due
     * to card sheet size limitations.
     *
     * @param {Array.{string}} nsids
     * @returns {Object.{string: Array.{string}}}
     */
    static groupNSIDs(nsids) {
        assert(Array.isArray(nsids));

        const result = {};
        for (const nsid of nsids) {
            const groupName = Spawn.getGroupName(nsid);
            if (!result[groupName]) {
                result[groupName] = [];
            }
            result[groupName].push(nsid);
        }
        return result;
    }

    /**
     * Suggest a (localized) name for an object.
     * Note that card names should not be set this way, they get reset to
     * the template `cardNames` value.
     *
     * @param {string} nsid
     * @returns {string} localized name
     */
    static suggestName(nsid) {
        const parsedNsid = ObjectNamespace.parseNsid(nsid);
        const groupName = Spawn.getGroupName(nsid);
        if (groupName.startsWith("card.")) {
            return locale(groupName.replace(/^card/, "deck"));
        }

        // A lot of names are NSID "type.name".
        let candidate = `${parsedNsid.type}.${parsedNsid.name}`;
        let candidateResult = locale(candidate);
        if (candidateResult !== candidate) {
            return candidateResult;
        }

        if (parsedNsid.type === "bag.unit") {
            const unitName = locale(`unit.${parsedNsid.name}`);
            return locale("bag.unit", { unit: unitName });
        }

        if (parsedNsid.type === "bag.token") {
            const tokenName = locale(`token.${parsedNsid.name}`);
            return locale("bag.token", { token: tokenName });
        }

        if (parsedNsid.type === "tile.system") {
            return locale("tile.system", { tile: parsedNsid.name });
        }

        if (parsedNsid.type.startsWith("token.attachment")) {
            let candidate = `token.attachment.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type.startsWith("token.exploration")) {
            let candidate = `token.exploration.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type.startsWith("token.wormhole")) {
            let candidate = `token.wormhole.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type === "token.command") {
            const factionAbbr = locale(`faction.${parsedNsid.name}`);
            return locale("token.command", { faction: factionAbbr });
        }
        if (parsedNsid.type === "token.control") {
            const factionAbbr = locale(`faction.${parsedNsid.name}`);
            return locale("token.control", { faction: factionAbbr });
        }

        // Try "token.{name}"?
        if (parsedNsid.type.startsWith("token")) {
            let candidate = `token.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }
    }

    /**
     * Spawn a known-nsid object.  Does not assign name.
     *
     * @param {string} nsid
     * @param {Vector} position
     * @param {Rotator} rotation
     * @returns {GameObject}
     */
    static spawn(nsid, position, rotation) {
        assert(typeof nsid === "string");
        assert(position instanceof Vector);
        assert(rotation instanceof Rotator);

        const templateId = NSID_TO_TEMPLATE[nsid];
        if (!templateId) {
            throw new Error(`Spawn.spawn invalid nsid "${nsid}"`);
        }

        const obj = world.createObjectFromTemplate(templateId, position);
        if (!obj) {
            throw new Error(`Spawn.spawn failed for "${nsid}"`);
        }

        obj.setRotation(rotation);
        return obj;
    }
}

module.exports = { Spawn };
