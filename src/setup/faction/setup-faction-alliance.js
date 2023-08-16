const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { CloneReplace } = require("../../lib/card/clone-replace");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { SpawnDeck } = require("../spawn/spawn-deck");
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
        let card = SpawnDeck.spawnDeck(nsidPrefix, pos, rot, (nsid) => {
            // "card.alliance:pok/faction"
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            return name === this.faction.nsidName;
        });

        if (!card || card.getStackSize() === 0) {
            console.log(
                `SetupFactionAlliance: missing "${this.faction.nsidName}"`
            );
            return;
        }

        // See the comment in CloneReplace for why.
        card = CloneReplace.cloneReplace(card);

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
            const name = parsed.name.split(".")[0];
            return name === this.faction.nsidName;
        });
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            card.destroy();
        }
    }
}

module.exports = { SetupFactionAlliance };
