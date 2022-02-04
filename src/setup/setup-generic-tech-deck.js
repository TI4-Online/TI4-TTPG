const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Rotator, Vector } = require("../wrapper/api");

class SetupGenericTechDeck {
    static setupDesk(playerDesk) {
        const deckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            if (parsedNsid.source.startsWith("homebrew")) {
                return false; // ignore homebrew
            }
            if (parsedNsid.source.startsWith("franken")) {
                return false; // ignore franken
            }
            return parsedNsid.type.startsWith("card.technology");
        });
        deckNsids.sort();

        // Spawn the decks, combine into one.
        const pos = playerDesk.pos;
        const rot = playerDesk.rot;
        let techDeck = false;
        deckNsids.forEach((deckNsid) => {
            const deckObj = Spawn.spawn(deckNsid, pos, rot);
            if (techDeck) {
                techDeck.addCards(deckObj);
            } else {
                techDeck = deckObj;
            }
        });

        // Remove any non-generic tech.
        Gather.gather(Gather.isFactionTechCardNsid, [techDeck]).forEach(
            (factionTechCard) => {
                factionTechCard.destroy();
            }
        );

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([techDeck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });
    }
}

module.exports = { SetupGenericTechDeck };
