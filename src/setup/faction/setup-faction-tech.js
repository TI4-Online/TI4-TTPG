const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

const { TECH_DECK_LOCAL_OFFSET } = require("../setup-generic-tech");

class SetupFactionTech extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(
            TECH_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        // Only use items listed in faction tables, not just because in deck.
        const acceptNames = new Set();
        this._faction.raw.techs.forEach((name) => acceptNames.add(name));
        this._faction.raw.units.forEach((name) => acceptNames.add(name));

        const nsidPrefix = "card.technology";
        this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.technology.red", "card.technology.red.muaat"
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 3);
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

        // Remove generic unit upgrades if faction tech has overrides?
        // Need to be sure clean restores them (or a higher level reset happens).
        // The counter-argument could be made a player wants to look at it
        // without tipping off other players.
    }

    clean() {
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (!nsid.startsWith("card.technology")) {
                return false;
            }
            const pos = cardOrDeck.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            const factionType = parsed.type.split(".")[3];
            return factionType === this.faction.nsidName;
        });
        for (const card of cards) {
            card.destroy();
        }
    }
}

module.exports = { SetupFactionTech };
