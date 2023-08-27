const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { CardUtil } = require("../lib/card/card-util");
const { Vector, world } = require("../wrapper/api");
const { SpawnDeck } = require("./spawn/spawn-deck");

const TECH_DECK_LOCAL_OFFSET = { x: 2, y: 8 };

class SetupGenericTech extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(
            new Vector(TECH_DECK_LOCAL_OFFSET.x, TECH_DECK_LOCAL_OFFSET.y, 2)
        );
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.technology";
        SpawnDeck.spawnDeck(nsidPrefix, pos, rot, (nsid) => {
            // "card.technology.red", "card.technology.red.muaat"
            // Accept any that don't have a third component.
            return !this.parseNsidGetTypePart(nsid, nsidPrefix, 3);
        });
    }

    clean() {
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (!nsid.startsWith("card.technology")) {
                return false;
            }
            const pos = cardOrDeck.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            return closestDesk === this.playerDesk;
        });
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            card.destroy();
        }
    }
}

module.exports = { SetupGenericTech, TECH_DECK_LOCAL_OFFSET };
