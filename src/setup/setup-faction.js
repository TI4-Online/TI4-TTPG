const assert = require("../wrapper/assert");
const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Vector } = require("../wrapper/api");
const { TECH_DECK_LOCAL_OFFSET } = require("./setup-generic-tech-deck");

const COMMAND_CONTROL_TOKENS = [
    {
        localOffset: {},
        tokenNsidType: "token.command",
        bagNsidType: "",
        bagType: 1, // regular
        tokenCount: 1,
    },
    {
        localOffset: {},
        tokenNsidType: "token.control",
        bagNsidType: "",
        bagType: 2, // infinite
        tokenCount: 1,
    },
];

class SetupFaction {
    static setupDesk(playerDesk, faction) {
        assert(typeof faction === "string");

        SetupFaction._setupFactionTech(playerDesk, faction);
        SetupFaction._setupFactionCommandControlTokens(playerDesk, faction);
    }

    static _setupFactionTech(playerDesk, faction) {
        assert(typeof faction === "string");

        const deckPos = new Vector(
            TECH_DECK_LOCAL_OFFSET.x,
            TECH_DECK_LOCAL_OFFSET.y + 10, // to the right, while testing
            TECH_DECK_LOCAL_OFFSET.z + 10 // drop on top
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

        // Remove any non-faction tech.
        Gather.gather(
            (nsid) => {
                return Gather.isFactionTechCardNsid(nsid) !== faction;
            },
            [techDeck]
        ).forEach((notThisFactionTechCard) => {
            notThisFactionTechCard.destroy();
        });

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([techDeck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });

        // Currently deck drops, if it hits another deck TTPG will join them.
        // We could do a cast and join it immediately.  For now nope.
    }

    static _setupFactionCommandControlTokens(playerDesk, faction) {
        assert(typeof faction === "string");
    }
}

module.exports = { SetupFaction };
