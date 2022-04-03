const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { CardUtil } = require("../lib/card/card-util");
const { ObjectNamespace } = require("../lib/object-namespace");

const PROMISSORY_DECK_LOCAL_OFFSET = { x: 11, y: -10, z: 0 };

class SetupGenericPromissory extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(
            PROMISSORY_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.promissory";
        const deck = this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.promissory.blue" (careful about "card.promissory.jolnar").
            const colorName = this.parseNsidGetTypePart(nsid, nsidPrefix, 2);
            return colorName === this.playerDesk.colorName;
        });
        deck.setName("");

        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    clean() {
        const filter = (nsid, cardOrDeck) => {
            // "card.promissory.blue" (careful about "card.promissory.jolnar").
            if (!nsid.startsWith("card.promissory")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            const colorName = parsed.type.split(".")[2];
            return colorName === this.playerDesk.colorName;
        };
        const cards = CardUtil.gatherCards(filter);
        for (const card of cards) {
            card.destroy();
        }
    }
}

module.exports = { SetupGenericPromissory, PROMISSORY_DECK_LOCAL_OFFSET };
