const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

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
            if (!CardUtil.isLooseCard(obj)) {
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
}

module.exports = { FactionToken };
