const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { PROMISSORY_DECK_LOCAL_OFFSET } = require("../setup-generic-promissory");
const { world } = require("../../wrapper/api");

class SetupFactionPromissory extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
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
        let deck = this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
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

        // These promissory notes seem to appear with the wrong image
        // (usually as the Aborec one, the first image in the deck).
        // That may be due to forming the deck and deleting cards same frame.
        // Pulling the card from the hand and putting it back seems to fix it.
        // Try making a copy to see if that resets it.
        const json = deck.toJSONString();
        const above = deck.getPosition().add([0, 0, 5]);
        deck.setTags(["DELETED_ITEMS_IGNORE"]);
        deck.destroy();
        deck = world.createObjectFromJSON(json, above);

        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    clean() {
        const nsidPrefix = `card.promissory.${this.faction.nsidName}`;
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (!nsid.startsWith(nsidPrefix)) {
                return false;
            }
            const pos = cardOrDeck.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                return false;
            }
            return true;
        });
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            card.destroy();
        }
    }
}

module.exports = { SetupFactionPromissory };
