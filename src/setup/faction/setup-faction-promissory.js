const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { PROMISSORY_DECK_LOCAL_OFFSET } = require("../setup-generic-promissory");

class SetupFactionPromissory extends AbstractSetup {
    constructor(playerDesk, faction) {
        super(playerDesk, faction);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(
            PROMISSORY_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        // Only use items listed in faction tables, not just because in deck.
        const acceptNames = new Set();
        this._faction.raw.promissoryNotes.forEach((name) =>
            acceptNames.add(name)
        );

        const nsidPrefix = "card.promissory";
        const deck = this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.promissory.jolnar" (careful about "card.promissory.blue").
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 2);
            if (factionName !== this._faction.raw.faction) {
                return false;
            }
            // Check if legal name.  Include "name.omega", etc versions.
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            if (!acceptNames.has(name)) {
                // Unwanted card in the deck, or a typo?
                console.log(`Unregistered "${nsid}"`);
                return false;
            }
            return true;
        });

        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    clean() {
        const nsidPrefix = `card.promissory.${this.faction.nsidName}`;
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            return nsid.startsWith(nsidPrefix);
        });
        for (const card of cards) {
            card.destroy();
        }
    }
}

module.exports = { SetupFactionPromissory };
