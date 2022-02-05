const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Vector } = require("../wrapper/api");

const PROMISSORY_DECK_LOCAL_OFFSET = { x: 11, y: -16, z: 7 };

class SetupGenericPromissory {
    static setupDesk(playerDesk) {
        const o = PROMISSORY_DECK_LOCAL_OFFSET;
        const pos = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        const rot = playerDesk.rot;

        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            if (parsedNsid.source.startsWith("homebrew")) {
                return false; // ignore homebrew
            }
            if (parsedNsid.source.startsWith("franken")) {
                return false; // ignore franken
            }
            return parsedNsid.type.startsWith("card.promissory");
        });
        mergeDeckNsids.sort();

        // Spawn the decks, combine into one.
        let deck = false;
        mergeDeckNsids.forEach((mergeDeckNsid) => {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (deck) {
                deck.addCards(mergeDeck);
            } else {
                deck = mergeDeck;
            }
        });
        console.log(`XXX1 ${deck.getStackSize()}`);

        // Remove any not-this-color promissory notes.
        Gather.gather(
            (nsid) => {
                return (
                    Gather.isFactionPromissoryNsid(nsid) !==
                    playerDesk.colorName
                );
            },
            [deck]
        ).forEach((card) => {
            card.destroy();
        });
        console.log(`XXX2 ${deck.getStackSize()}`);

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([deck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });
    }
}

module.exports = { SetupGenericPromissory, PROMISSORY_DECK_LOCAL_OFFSET };
