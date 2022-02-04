const assert = require("../wrapper/assert");
const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerArea } = require("../lib/player-area");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Spawn } = require("./spawn/spawn");
const { Container, ObjectType, Vector, world } = require("../wrapper/api");
const { TECH_DECK_LOCAL_OFFSET } = require("./setup-generic-tech-deck");
const Rotator = require("../mock/mock-rotator");

const COMMAND_TOKENS = {
    tokenNsidType: "token.command",
    bagNsid: "bag:base/garbage",
    bagLocalOffset: { x: -10, y: 23, z: 0 },
    bagType: 2, // regular
    bagTokenCount: 16,
    commandSheetLocalOffsets: [
        // Tactic
        { x: 6.7, y: -2.3, z: 1, yaw: -90 },
        { x: 6.7, y: 0.5, z: 1, yaw: -90 },
        { x: 3.7, y: -1.0, z: 1, yaw: -90 },
        // Fleet
        { x: 4.5, y: 3.8, z: 1, yaw: -90, roll: 180 },
        { x: 2.6, y: 1.8, z: 1, yaw: -90, roll: 180 },
        { x: 1.6, y: 5.4, z: 1, yaw: -90, roll: 180 },
        // Strategy
        { x: -1.3, y: 5.7, z: 1, yaw: -90 },
        { x: -4.3, y: 4.0, z: 1, yaw: -90 },
    ],
};
const CONTROL_TOKENS = {
    tokenNsidType: "token.control",
    bagNsid: "bag:base/garbage",
    bagLocalOffset: { x: -22, y: 23, z: 0 },
    bagType: 1, // infinite
    bagTokenCount: 1,
};

class SetupFaction {
    static setupDesk(playerDesk, factionNsidName) {
        assert(typeof factionNsidName === "string");

        // Expect the "Faction" class to provide this, for now dig it out.
        const faction = {
            nsidName: factionNsidName,
            nsidSource: SetupFaction._getFactionSource(factionNsidName),
        };

        SetupFaction._setupFactionTech(playerDesk, faction);

        const commandTokensBag = SetupFaction._setupFactionCommandControlTokens(
            playerDesk,
            faction,
            COMMAND_TOKENS
        );
        const ownerTokensBag = SetupFaction._setupFactionCommandControlTokens(
            playerDesk,
            faction,
            CONTROL_TOKENS
        );

        SetupFaction._placeInitialCommandTokens(
            playerDesk,
            faction,
            commandTokensBag
        );
    }

    static _getFactionSource(factionNsidName) {
        for (const nsid of Spawn.getAllNSIDs()) {
            if (nsid.startsWith("token.command")) {
                const parsedNsid = ObjectNamespace.parseNsid(nsid);
                if (parsedNsid.name === factionNsidName) {
                    return parsedNsid.source;
                }
            }
        }
        throw new Error(`unknown faction "${factionNsidName}"`);
    }

    static _setupFactionTech(playerDesk, faction) {
        assert(typeof faction.nsidName === "string");

        const o = TECH_DECK_LOCAL_OFFSET;
        const deckPos = new Vector(o.x, o.y + 8, o.z + 10) // to the side, TTPG does not join on drop
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
                return Gather.isFactionTechCardNsid(nsid) !== faction.nsidName;
            },
            [techDeck]
        ).forEach((notThisFactionTechCard) => {
            notThisFactionTechCard.destroy();
        });

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([techDeck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });
    }

    static _setupFactionCommandControlTokens(playerDesk, faction, tokenData) {
        assert(typeof faction.nsidName === "string");
        assert(typeof faction.nsidSource === "string");

        const o = tokenData.bagLocalOffset;
        const bagPos = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        const bagRot = playerDesk.rot;

        const slotColor = PlayerArea.getPlayerSlotColor(playerDesk.playerSlot);

        // Spawn bag.
        const bagNsid = tokenData.bagNsid;
        let bag = Spawn.spawn(bagNsid, bagPos, bagRot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setPrimaryColor(slotColor);
        bag.setOwningPlayerSlot(playerDesk.playerSlot);

        // Bag needs to have the correct type at create time.  If not infinite, fix and respawn.
        if (bag.getType() !== tokenData.bagType) {
            bag.setType(tokenData.bagType);
            const json = bag.toJSONString();
            bag.destroy();
            bag = world.createObjectFromJSON(json, bagPos);
            bag.setRotation(bagRot);
        }

        const tokenNsid = `${tokenData.tokenNsidType}:${faction.nsidSource}/${faction.nsidName}`;
        const above = bagPos.add([0, 0, 10]);
        for (let i = 0; i < tokenData.bagTokenCount; i++) {
            const token = Spawn.spawn(tokenNsid, above, bagRot);
            token.setPrimaryColor(slotColor);
            bag.addObjects([token]);
        }

        return bag;
    }

    static _placeInitialCommandTokens(playerDesk, faction, commandTokensBag) {
        assert(typeof faction.nsidName === "string");
        assert(typeof faction.nsidSource === "string");
        assert(commandTokensBag instanceof Container);

        // Find the command sheet.
        const commandSheetNsid = "sheet:base/command";
        const commandSheetOwner = playerDesk.playerSlot;
        let commandSheet = false;
        for (const obj of world.getAllObjects()) {
            if (
                ObjectNamespace.getNsid(obj) === commandSheetNsid &&
                obj.getOwningPlayerSlot() === commandSheetOwner
            ) {
                commandSheet = obj;
                break;
            }
        }
        if (!commandSheet) {
            return; // no command sheet? abort.
        }

        assert(
            commandTokensBag.getNumItems() >=
                COMMAND_TOKENS.commandSheetLocalOffsets.length
        );
        COMMAND_TOKENS.commandSheetLocalOffsets.forEach((offset) => {
            const pos = commandSheet.localPositionToWorld([
                offset.x,
                offset.y,
                offset.z,
            ]);
            const rot = commandSheet.localRotationToWorld([
                offset.pitch || 0,
                offset.yaw || 0,
                offset.roll || 0,
            ]);
            const token = commandTokensBag.takeAt(0, pos, true);
            token.setRotation(rot);
        });
    }
}

module.exports = { SetupFaction };
