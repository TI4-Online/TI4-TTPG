const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

const _injectedNSIDs = new Set();

/**
 * Remove objects not enabled in TI4.config (e.g. using PoK?).
 */
class RestrictObjects {
    static injectRestrictNsid(nsid) {
        assert(typeof nsid === "string");
        _injectedNSIDs.add(nsid);
    }

    /**
     * Find all objects where config rejects it
     * (not including ReplaceObjects candidates).
     *
     * @param {Array.{GameObject}|undefinted} objs
     */
    static removeRestrictObjects(objs = false) {
        if (!objs) {
            objs = world.getAllObjects();
        }

        const removeSources = new Set();
        if (world.TI4.config.pok) {
            removeSources.add("base.only");
        } else {
            removeSources.add("pok");
        }
        if (!world.TI4.config.codex1) {
            removeSources.add("codex.ordinian");
        }
        if (!world.TI4.config.codex2) {
            removeSources.add("codex.affinity");
        }
        if (!world.TI4.config.codex3) {
            removeSources.add("codex.vigil");
        }
        if (!world.TI4.config.codex4) {
            removeSources.add("codex.liberation");
        }

        let removedCount = 0;

        // Scan for non-card objects.
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            const parsed = ObjectNamespace.parseGeneric(obj);

            let remove = false;
            if (_injectedNSIDs.has(nsid)) {
                remove = true;
            } else if (parsed && removeSources.has(parsed.source)) {
                remove = true;
            }

            if (remove) {
                const container = obj.getContainer();
                if (container) {
                    container.remove(obj);
                } else {
                    obj.destroy();
                }
                removedCount += 1;
            }
        }

        // Get cards in decks.
        const deleCards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (_injectedNSIDs.has(nsid)) {
                return true;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            return parsed && removeSources.has(parsed.source);
        });
        for (const deleCard of deleCards) {
            deleCard.destroy();
            removedCount += 1;
        }

        return removedCount;
    }
}

module.exports = { RestrictObjects };
