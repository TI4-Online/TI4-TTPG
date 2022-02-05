const assert = require("../wrapper/assert");
const { Gather } = require("./spawn/gather");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerArea } = require("../lib/player-area");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Spawn } = require("./spawn/spawn");
const {
    Card,
    Container,
    ObjectType,
    Vector,
    world,
} = require("../wrapper/api");
const { TECH_DECK_LOCAL_OFFSET } = require("./setup-generic-tech-deck");
const { PROMISSORY_DECK_LOCAL_OFFSET } = require("./setup-generic-promissory");

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

const LEADERS = {
    agent: {
        sheetLocalOffset: { x: 6.88, y: -0.11, z: 1 },
        roll: 180,
    },
    commander: {
        sheetLocalOffset: { x: 2.28, y: -0.1, z: 1 },
        roll: 0,
    },
    hero: {
        sheetLocalOffset: { x: -2.28, y: -0.11, z: 1 },
        roll: 0,
    },
    mech: {
        sheetLocalOffset: { x: -6.88, y: -0.11, z: 1 },
        roll: 180,
    },
};
const EXTRA_LEADER_OFFSET_Y = -5;

class SetupFaction {
    static setupDesk(playerDesk, factionNsidName) {
        assert(typeof factionNsidName === "string");

        // Expect the "Faction" class to provide this, for now dig it out.
        const faction = {
            nsidName: factionNsidName,
            nsidSource: SetupFaction._getFactionSource(factionNsidName),
        };

        SetupFaction._setupFactionTech(playerDesk, faction);
        SetupFaction._setupFactionPromissoryNotes(playerDesk, faction);

        const leaderDeck = SetupFaction._setupFactionLeaders(
            playerDesk,
            faction
        );
        SetupFaction._moveLeadersToSheet(playerDesk, leaderDeck);

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

        SetupFaction._placeScoreboardOwnerToken(ownerTokensBag);
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

    static _spawnDecksThenFilter(pos, rot, nsidPrefix, filterNsid) {
        assert(typeof pos.x === "number"); // "instanceof Vector" broken
        assert(typeof rot.yaw === "number"); // "instanceof Rotator" broken
        assert(typeof nsidPrefix === "string");
        assert(typeof filterNsid === "function");

        // Find existing deck to join.  Dropping a new deck on top only
        // creates a stack of two decks; TTPG does not auto-join.
        const start = pos.add([0, 0, 20]);
        const end = pos.subtract([0, 0, 20]);
        const traceHit = world.lineTrace(start, end).find((traceHit) => {
            if (!(traceHit.object instanceof Card)) {
                return false; // only looking for decks
            }
            // ObjectNamespace.getNsid intentionally returns nothing for decks
            // because there are many nsids inside.  Look at first of those.
            const nsid = ObjectNamespace.getDeckNsids(traceHit.object)[0];
            return nsid.startsWith(nsidPrefix);
        });
        const existingDeck = traceHit && traceHit.object;

        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            if (parsedNsid.source.startsWith("homebrew")) {
                return false; // ignore homebrew
            }
            if (parsedNsid.source.startsWith("franken")) {
                return false; // ignore franken
            }
            return parsedNsid.type.startsWith(nsidPrefix);
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

        // Remove any filter-rejected cards.
        Gather.gather(
            (nsid) => {
                return !filterNsid(nsid);
            },
            [deck]
        ).forEach((filterRejectedCard) => {
            filterRejectedCard.destroy();
        });

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([deck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });

        // Add to existing generic tech deck.
        if (existingDeck) {
            existingDeck.addCards(deck);
            deck = existingDeck;
        }

        return deck;
    }

    static _deskLocalOffsetToWorld(playerDesk, deskLocalOffset) {
        return new Vector(
            deskLocalOffset.x,
            deskLocalOffset.y,
            deskLocalOffset.z
        )
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
    }

    static _setupFactionTech(playerDesk, faction) {
        assert(typeof faction.nsidName === "string");

        const pos = SetupFaction._deskLocalOffsetToWorld(
            playerDesk,
            TECH_DECK_LOCAL_OFFSET
        );
        const rot = playerDesk.rot;

        this._spawnDecksThenFilter(pos, rot, "card.technology", (nsid) => {
            return Gather.isFactionTechCardNsid(nsid) === faction.nsidName;
        });
    }

    static _setupFactionPromissoryNotes(playerDesk, faction) {
        assert(typeof faction.nsidName === "string");

        const pos = SetupFaction._deskLocalOffsetToWorld(
            playerDesk,
            PROMISSORY_DECK_LOCAL_OFFSET
        );
        const rot = playerDesk.rot;

        this._spawnDecksThenFilter(pos, rot, "card.promissory", (nsid) => {
            return Gather.isFactionPromissoryNsid(nsid) === faction.nsidName;
        });
    }

    static _setupFactionLeaders(playerDesk, faction) {
        assert(typeof faction.nsidName === "string");

        const pos = playerDesk.pos.add([0, 0, 5]);
        const rot = playerDesk.rot;

        return this._spawnDecksThenFilter(pos, rot, "card.leader", (nsid) => {
            return Gather.isFactionLeaderNsid(nsid) === faction.nsidName;
        });
    }

    static _moveLeadersToSheet(playerDesk, leaderDeck) {
        assert(leaderDeck instanceof Card);

        // Find the leader sheet.
        const leaderSheetNsid = "sheet:pok/leader";
        const leaderSheetOwner = playerDesk.playerSlot;
        let leaderSheet = false;
        for (const obj of world.getAllObjects()) {
            if (
                ObjectNamespace.getNsid(obj) === leaderSheetNsid &&
                obj.getOwningPlayerSlot() === leaderSheetOwner
            ) {
                leaderSheet = obj;
                break;
            }
        }
        if (!leaderSheet) {
            return; // no leaderSheet sheet? abort.
        }

        const cardObjectArray = Gather.gather(
            (nsid) => {
                return true;
            },
            [leaderDeck]
        );

        const leaderTypeToCount = {
            agent: 0,
            commander: 0,
            hero: 0,
            mech: 0,
        };
        cardObjectArray.forEach((card) => {
            const nsid = ObjectNamespace.getNsid(card);
            assert(nsid.startsWith("card.leader"));
            const leaderType = nsid.split(".")[2];
            const count = leaderTypeToCount[leaderType];
            assert(typeof count === "number");
            leaderTypeToCount[leaderType] = count + 1;
            const leaderData = LEADERS[leaderType];
            const o = leaderData.sheetLocalOffset;
            const localOffset = new Vector(o.x, o.y, o.z).add([
                0,
                EXTRA_LEADER_OFFSET_Y * count,
                0,
            ]);
            const pos = leaderSheet.localPositionToWorld(localOffset);
            const rot = leaderSheet.localRotationToWorld([
                0,
                0,
                leaderData.roll,
            ]);
            card.setPosition(pos);
            card.setRotation(rot);
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

    static _placeScoreboardOwnerToken(ownerTokensBag) {
        // TODO XXX
    }
}

module.exports = { SetupFaction };
