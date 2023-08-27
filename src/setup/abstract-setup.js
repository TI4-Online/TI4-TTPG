const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Vector, world } = require("../wrapper/api");

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
