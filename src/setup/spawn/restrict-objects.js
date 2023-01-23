const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

/**
 * Remove objects not enabled in TI4.config (e.g. using PoK?).
 */
class RestrictObjects {
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
            removeSources.add("codex.(codex4)");
        }

        let removedCount = 0;

        // Scan for non-card objects.
        for (const obj of world.getAllObjects()) {
            const parsed = ObjectNamespace.parseGeneric(obj);
            if (parsed && removeSources.has(parsed.source)) {
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
