const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, world } = require("../../wrapper/api");
const REPLACE_DATA = require("./replace-objects.data.json");

/**
 * Remove deprecated objects
 */
class ReplaceObjects {
    /**
     * For some specific homebrew allow new rules for replacement.
     * Map from remove NSID to use NSID.
     *
     * @param {Object} dict
     */
    static injectReplace(removeNSID, useNSID) {
        assert(typeof removeNSID === "string");
        assert(typeof useNSID === "string");
        REPLACE_DATA[removeNSID] = useNSID;
    }

    /**
     * Find all objects where the replacement is available.
     * Extracts cards from stacks.
     *
     * @returns {Array.{GameObject}}
     */
    static getReplacedObjects(objs = false) {
        if (!objs) {
            objs = world.getAllObjects();
        }

        const newNsidToOldNsid = {};
        const oldNsidToNewNsid = {};
        for (const [oldNsid, newNsid] of Object.entries(REPLACE_DATA)) {
            newNsidToOldNsid[newNsid] = oldNsid;
            oldNsidToNewNsid[oldNsid] = newNsid;
        }

        // Optionally use base Magen over the omega version.
        if (world.TI4.config.baseMagen) {
            const omega =
                "card.technology.red:codex.ordinian/magen_defense_grid.omega";
            const base = "card.technology.red:base/magen_defense_grid";
            delete newNsidToOldNsid[omega];
            delete oldNsidToNewNsid[base];
            newNsidToOldNsid[base] = omega;
            oldNsidToNewNsid[omega] = base;
        }

        // Get nsids for replacements (not the things getting replaced).
        // Do not pull cards from decks.
        const seenNewNsidSet = new Set();
        for (const obj of world.getAllObjects()) {
            if (obj instanceof Card && obj.getStackSize() > 1) {
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (const nsid of nsids) {
                    if (newNsidToOldNsid[nsid]) {
                        seenNewNsidSet.add(nsid);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                if (newNsidToOldNsid[nsid]) {
                    seenNewNsidSet.add(nsid);
                }
            }
        }

        // Now find to-be-replaced objects, but only if replacement exists.
        const result = [];
        const newToOld = {};
        for (const obj of objs) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj instanceof Card && obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    const replaceWithNsid = oldNsidToNewNsid[nsid];
                    if (seenNewNsidSet.has(replaceWithNsid)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
                        newToOld[replaceWithNsid] = nsid;
                        result.push(cardObj);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                const replaceWithNsid = oldNsidToNewNsid[nsid];
                if (seenNewNsidSet.has(replaceWithNsid)) {
                    newToOld[replaceWithNsid] = nsid;
                    result.push(obj);
                }
            }

            //if (!world.__isMock) {
            //    for (const [newNsid, oldNsid] of Object.entries(newToOld)) {
            //        console.log(
            //            `ReplaceObjects: removing "${oldNsid}", favoring "${newNsid}"`
            //        );
            //    }
            //}
        }

        return result;
    }

    static removeReplacedObjects(objs = false) {
        const removeObjs = ReplaceObjects.getReplacedObjects(objs);
        const removedCount = removeObjs.length;
        for (const obj of removeObjs) {
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
        return removedCount;
    }
}

module.exports = {
    ReplaceObjects,
};
