const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../../setup/abstract-setup");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { Rotator, Vector, world } = require("../../wrapper/api");

/**
 * "Faction Token" and/or "Faction Reference" cards.
 */
class FactionToken {
    /**
     * Find faction token for player desk.
     *
     * @param {PlayerDesk} playerDesk
     */
    static getByPlayerDesk(playerDesk) {
        // Find token closest to desk.
        let best = undefined;
        let bestDSq = Number.MAX_VALUE;
        const center = playerDesk.center;
        for (const obj of world.getAllObjects()) {
            const checkDiscard = false;
            const allowFaceDown = true;
            if (!CardUtil.isLooseCard(obj, checkDiscard, allowFaceDown)) {
                continue;
            }
            if (
                ObjectNamespace.isFactionReference(obj) ||
                ObjectNamespace.isFactionToken(obj)
            ) {
                const dSq = center
                    .subtract(obj.getPosition())
                    .magnitudeSquared();
                if (dSq < bestDSq) {
                    best = obj;
                    bestDSq = dSq;
                }
            }
        }

        // Make sure it isn't closer to a different desk!
        if (best) {
            const pos = best.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== playerDesk) {
                best = undefined;
            }
        }

        return best;
    }

    static findOrSpawnFactionReference(nsidName) {
        assert(typeof nsidName === "string");

        const faction = world.TI4.getFactionByNsidName(nsidName);
        assert(faction);

        // Careful, with Codex 3 these might be omega AND have a different source.
        // Look for existing card.
        const filterNsid = (nsid) => {
            if (!nsid.startsWith("card.faction_reference")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0]; // omega
            return name === nsidName;
        };

        const gather = CardUtil.gatherCards(filterNsid);
        let card = gather[0];
        if (card) {
            return card;
        }

        // Spawn a new one.
        const pos = new Vector(0, 0, world.getTableHeight() + 10);
        const rot = new Rotator(0, 0, 0);
        const nsidPrefix = "card.faction_reference";
        card = new AbstractSetup(undefined, undefined).spawnDecksThenFilter(
            pos,
            rot,
            nsidPrefix,
            filterNsid
        );
        assert(card);
        return card;
    }
}

module.exports = { FactionToken };
