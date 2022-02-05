const assert = require("../wrapper/assert");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerDesk } = require("../lib/player-desk");
const { Spawn } = require("./spawn/spawn");
const {
    Card,
    Container,
    ObjectType,
    Rotator,
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

// This goes away when faction can be provided as a proper table.
function _getFactionSource(factionNsidName) {
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

class SetupFaction extends AbstractSetup {
    constructor(playerDesk, factionNsidName) {
        assert(playerDesk instanceof PlayerDesk);
        assert(typeof factionNsidName === "string");
        super();
        this.setPlayerDesk(playerDesk);

        // Expect the "Faction" class to provide this, for now dig it out.
        this._faction = {
            nsidName: factionNsidName,
            nsidSource: _getFactionSource(factionNsidName),
        };
    }

    setup() {
        this._setupFactionTech();
        this._setupFactionPromissoryNotes();

        this._leaderDeck = this._setupFactionLeaders();
        this._moveLeadersToSheet(this._leaderDeck);

        this._commandTokensBag =
            this._setupFactionCommandControlTokens(COMMAND_TOKENS);
        this._ownerTokensBag =
            this._setupFactionCommandControlTokens(CONTROL_TOKENS);

        this._placeInitialCommandTokens(this._commandTokensBag);
        this._placeScoreboardOwnerToken(this._ownerTokensBag);
    }

    _setupFactionTech() {
        const pos = this.playerDesk.localPositionToWorld(
            TECH_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.technology";
        this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.technology.red", "card.technology.red.muaat"
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 3);
            return factionName === this._faction.nsidName;
        });
    }

    _setupFactionPromissoryNotes() {
        const pos = this.playerDesk.localPositionToWorld(
            PROMISSORY_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.promissory";
        this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.promissory.jolnar" (careful about "card.promissory.blue").
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 2);
            return factionName === this._faction.nsidName;
        });
    }

    _setupFactionLeaders() {
        // Arbitrary, will move to leader sheet later.
        const pos = this.playerDesk.pos.add([0, 0, 5]);
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.leader";
        return this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.leader.agent.x"
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 3);
            return factionName === this._faction.nsidName;
        });
    }

    _moveLeadersToSheet(leaderDeck) {
        assert(leaderDeck instanceof Card);

        // Find the leader sheet.
        const leaderSheetNsid = "sheet:pok/leader";
        const leaderSheet = this.findOjectOwnedByPlayerDesk(leaderSheetNsid);
        if (!leaderSheet) {
            return; // no leaderSheet sheet? abort.
        }

        const cardObjectArray = this.separateCards(leaderDeck);

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
            // GameObject.localRotationToWorld is broken (should be fixed in Feb2022)
            //const rot = leaderSheet.localRotationToWorld([
            //    0,
            //    0,
            //    leaderData.roll,
            //]);
            // Workaround:
            const rot = new Rotator(0, 0, leaderData.roll).compose(
                leaderSheet.getRotation()
            );
            card.setPosition(pos);
            card.setRotation(rot);
        });
    }

    _setupFactionCommandControlTokens(tokenData) {
        const pos = this.playerDesk.localPositionToWorld(
            tokenData.bagLocalOffset
        );
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;

        // Spawn bag.
        const bagNsid = tokenData.bagNsid;
        let bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setPrimaryColor(color);
        bag.setOwningPlayerSlot(playerSlot);

        // Bag needs to have the correct type at create time.  If not infinite, fix and respawn.
        if (bag.getType() !== tokenData.bagType) {
            bag.setType(tokenData.bagType);
            const json = bag.toJSONString();
            bag.destroy();
            bag = world.createObjectFromJSON(json, pos);
            bag.setRotation(rot);
        }

        const tokenNsid = `${tokenData.tokenNsidType}:${this._faction.nsidSource}/${this._faction.nsidName}`;
        const above = pos.add([0, 0, 10]);
        for (let i = 0; i < tokenData.bagTokenCount; i++) {
            const token = Spawn.spawn(tokenNsid, above, rot);
            token.setPrimaryColor(color);
            bag.addObjects([token]);
        }

        return bag;
    }

    _placeInitialCommandTokens(commandTokensBag) {
        assert(commandTokensBag instanceof Container);

        // Find the command sheet.
        const commandSheetNsid = "sheet:base/command";
        const commandSheet = this.findOjectOwnedByPlayerDesk(commandSheetNsid);
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

    _placeScoreboardOwnerToken(ownerTokensBag) {
        // TODO XXX
    }
}

module.exports = { SetupFaction };
