const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const { Position, Rotator, world } = require("../../wrapper/api");

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

        const cardNsid = `card.faction_reference:${faction.nsidSource}/${faction.nsidName}`;

        // Look for existing card.
        const gather = CardUtil.gatherCards((nsid) => {
            return nsid === cardNsid;
        });
        if (gather.length > 0) {
            return gather[0];
        }

        // Spawn a new one.
        const pos = new Position(0, 0, world.getTableHeight() + 10);
        const rot = new Rotator(0, 0, 0);
        const card = Spawn.spawn(cardNsid, pos, rot);
        assert(card);
        return card;
    }
}

module.exports = { FactionToken };
