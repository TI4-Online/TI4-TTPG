const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CloneReplace } = require("../../lib/clone-replace");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { Container, ObjectType, Rotator, world } = require("../../wrapper/api");
const { Facing } = require("../../lib/facing");

const COMMAND_TOKENS = {
    tokenNsidType: "token.command",
    tokenCount: 16,
    bagNsid: "bag.token.command:base/*",
    bagPos: { x: 1, y: 13, z: 0 },
    bagYaw: 45,
    bagType: 2, // regular
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
    tokenCount: 1,
    bagNsid: "bag.token.control:base/*",
    bagType: 1, // infinite
    bagPos: { x: 1, y: 7, z: 0 },
    bagYaw: COMMAND_TOKENS.bagYaw,
};

class SetupFactionTokens extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const controlTokensBag = this._spawnFactionTokensAndBag(CONTROL_TOKENS);
        this._placeScoreboradControlToken(controlTokensBag);
        const commandTokensBag = this._spawnFactionTokensAndBag(COMMAND_TOKENS);
        this._placeInitialCommandTokens(commandTokensBag);
    }

    clean() {
        const playerSlot = this.playerDesk.playerSlot;

        const deleSet = new Set();
        deleSet.add(
            `token.command:${this.faction.nsidSource}/${this.faction.nsidName}`
        );
        deleSet.add(
            `token.control:${this.faction.nsidSource}/${this.faction.nsidName}`
        );
        deleSet.add(`bag.token.command:base/*`);
        deleSet.add(`bag.token.control:base/*`);

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!deleSet.has(nsid)) {
                continue;
            }
            obj.destroy();
        }
    }

    /**
     * Spawn a bag and fill with faction tokens.
     *
     * Token data has:
     * - {string} bagNsid
     * - {string} tokenNsidType
     * - {number} tokenCount
     *
     * Token nsid is 'tokenNsidType:factionSource:factionNsidName'
     *
     * @param {Object} tokenData
     * @returns {Container} spawned bag
     */
    _spawnFactionTokensAndBag(tokenData) {
        const pos = this.playerDesk.localPositionToWorld(tokenData.bagPos);
        const rot = new Rotator(0, tokenData.bagYaw, 0).compose(
            this.playerDesk.rot
        );
        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;

        // Spawn bag.
        const bagNsid = tokenData.bagNsid;
        let bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setOwningPlayerSlot(playerSlot);
        bag.setPrimaryColor(color);

        // Bag needs to have the correct type at create time.  If not infinite, fix and respawn.
        if (bag.getType() !== tokenData.bagType) {
            bag.setType(tokenData.bagType);
            const json = bag.toJSONString();
            bag.destroy();
            bag = world.createObjectFromJSON(json, pos);
            bag.setRotation(rot);
        }

        const tokenNsid = `${tokenData.tokenNsidType}:${this.faction.nsidSource}/${this.faction.nsidName}`;
        const above = pos.add([0, 0, 10]);
        for (let i = 0; i < tokenData.tokenCount; i++) {
            const token = Spawn.spawn(tokenNsid, above, rot);
            token.setOwningPlayerSlot(playerSlot);
            token.setPrimaryColor(color);
            bag.addObjects([token]);
        }

        return bag;
    }

    _placeScoreboradControlToken() {
        let scoreboard = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "token:base/scoreboard") {
                continue;
            }
            scoreboard = obj;
            break;
        }
        if (!scoreboard) {
            return;
        }

        const tokenNsid = `token.control:${this.faction.nsidSource}/${this.faction.nsidName}`;
        let x = 16;
        if (Facing.isFaceDown(scoreboard)) {
            x = -x;
        }
        const y =
            -2 +
            (4 * this.playerDesk.index) / (world.TI4.config.playerCount - 1);
        const pos = scoreboard.localPositionToWorld([x, y, 0]).add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        const token = Spawn.spawn(tokenNsid, pos, rot);

        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;
        token.setOwningPlayerSlot(playerSlot);
        token.setPrimaryColor(color);
    }

    _placeInitialCommandTokens(commandTokensBag) {
        assert(commandTokensBag instanceof Container);

        // Find the command sheet.
        const commandSheetNsid = "sheet:base/command";
        const commandSheet = this.findObjectOwnedByPlayerDesk(commandSheetNsid);
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

            // Workaround for TTPG bug.
            CloneReplace.cloneReplace(token);
        });
    }
}

module.exports = { SetupFactionTokens };
