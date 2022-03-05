const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

class SetupFactionAlliance extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        if (!world.TI4.config.pok) {
            return;
        }

        // Arbitrary, will move to leader sheet later.
        const pos = this.playerDesk.pos.add([-5, 0, 5]);
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.alliance";
        const card = this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.alliance:pok/faction"
            const parsed = ObjectNamespace.parseNsid(nsid);
            return parsed.name === this.faction.nsidName;
        });

        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(card, playerSlot);
    }

    clean() {
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (!nsid.startsWith("card.alliance")) {
                return false;
            }
            const pos = cardOrDeck.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            return parsed.name === this.faction.nsidName;
        });
        for (const card of cards) {
            card.destroy();
        }
    }
}

module.exports = { SetupFactionAlliance };
