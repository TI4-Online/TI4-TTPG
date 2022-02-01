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
        const seekNsids = new Set();
        for (const [oldNsid, newNsid] of Object.entries(REPLACE_DATA)) {
            seekNsids.add(oldNsid);
            seekNsids.add(newNsid);
        }

        const nsidToObjects = {};
        for (const nsid of seekNsids) {
            nsidToObjects[nsid] = [];
        }

        // Group objects by NSID for replace rules to check.
        for (const obj of world.getAllObjects()) {
            // ObjectNamespace won't give a nsid for a stack (deck), unless a single card.
            const objNsid = ObjectNamespace.getNsid(obj);
            if (objNsid && seekNsids.has(objNsid)) {
                nsidToObjects[objNsid].push(obj);
            }

            // getAllObjects looks inside containers, but not stacks (decks).
            if (obj instanceof Card && obj.getStackSize() > 1) {
                const cardNsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = cardNsids.length - 1; i >= 0; i--) {
                    const cardNsid = cardNsids[i];
                    if (seekNsids.has(cardNsid)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj;
                        }
                        nsidToObjects[cardNsid].push(cardObj);
                    }
                }
            }
        }

        const replacedObjects = [];
        for (const [oldNsid, newNsid] of Object.entries(REPLACE_DATA)) {
            if (!nsidToObjects[newNsid]) {
                continue; // replacement not found, leave old version in place
            }
            if (nsidToObjects[oldNsid]) {
                replacedObjects.push(...nsidToObjects[oldNsid]);
            }
        }

        return replacedObjects;
    }
}

module.exports = {
    ReplaceObjects,
};
