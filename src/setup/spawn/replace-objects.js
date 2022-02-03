const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, world } = require("../../wrapper/api");
const REPLACE_DATA = require("./replace-objects.data.json");

/**
 * Remove deprecated objects
 */
class ReplaceObjects {
    /**
     * Find all objects where the replacement is available.
     * Extracts cards from stacks.
     *
     * @returns {Array.{GameObject}}
     */
    static getReplacedObjects() {
        const newNsidSet = new Set(Object.values(REPLACE_DATA));

        // Get nsids for replacements (not the things getting replaced).
        // Do not pull cards from decks.
        const seenNewNsidSet = new Set();
        for (const obj of world.getAllObjects()) {
            if (obj instanceof Card && obj.getStackSize() > 1) {
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (const nsid of nsids) {
                    if (newNsidSet.has(nsid)) {
                        seenNewNsidSet.add(nsid);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                if (newNsidSet.has(nsid)) {
                    seenNewNsidSet.add(nsid);
                }
            }
        }

        // Now find to-be-replaced objects, but only if replacement exists.
        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj instanceof Card && obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    const replaceWithNsid = REPLACE_DATA[nsid];
                    if (seenNewNsidSet.has(replaceWithNsid)) {
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
                const replaceWithNsid = REPLACE_DATA[nsid];
                if (seenNewNsidSet.has(replaceWithNsid)) {
                    result.push(obj);
                }
            }
        }

        return result;
    }
}

module.exports = {
    ReplaceObjects,
};
