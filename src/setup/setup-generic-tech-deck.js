const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Vector } = require("../wrapper/api");

const TECH_DECK_LOCAL_OFFSET = { x: 11, y: -24, z: 7 };

class SetupGenericTechDeck {
    static setupDesk(playerDesk) {
        const deckPos = new Vector(
            TECH_DECK_LOCAL_OFFSET.x,
            TECH_DECK_LOCAL_OFFSET.y,
            TECH_DECK_LOCAL_OFFSET.z
        )
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        const deckRot = playerDesk.rot;

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
        let techDeck = false;
        deckNsids.forEach((deckNsid) => {
            const deckObj = Spawn.spawn(deckNsid, deckPos, deckRot);
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
