const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { ObjectType, Vector, world } = require("../../wrapper/api");

const FACTION_SHEET_POS = { x: 18, y: 0 };

class SetupFactionSheet extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        let pos = new Vector(FACTION_SHEET_POS.x, FACTION_SHEET_POS.y, 0);
        pos = this.playerDesk.localPositionToWorld(pos);
        pos.z = world.getTableHeight() + 3;
        const rot = this.playerDesk.rot;

        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        const sheet = Spawn.spawn(sheetNsid, pos, rot);
        sheet.snapToGround();
        sheet.setObjectType(ObjectType.Ground);
        const objNsid = ObjectNamespace.getNsid(sheet);
        if (objNsid !== sheetNsid) {
            throw new Error(
                `SetupFactionSheet: sheet has nsid "${objNsid}", expected "${sheetNsid}"`
            );
        }

        // Got a report of the sheet spawning beneath the leader/command sheets.
        // Check z.
        let leaderSheet = undefined;
        let commandSheet = undefined;
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            if (ObjectNamespace.isCommandSheet(obj)) {
                commandSheet = obj;
            }
            if (ObjectNamespace.isLeaderSheet(obj)) {
                leaderSheet = obj;
            }
        }
        let remainingAttempts = 3;
        const maybeFixZ = () => {
            if (remainingAttempts-- <= 0) {
                return; // give up
            }

            const factionSheetZ = sheet.getPosition().z;
            const commandSheetZ = commandSheet
                ? commandSheet.getPosition().z
                : -1;
            const leaderSheetZ = leaderSheet ? leaderSheet.getPosition().z : -1;
            if (
                factionSheetZ >= commandSheetZ &&
                factionSheetZ >= leaderSheetZ
            ) {
                return; // faction sheet on top, stop
            }

            console.log(
                "SetupFactionSheet: fixing layering with leader/command sheets"
            );
            sheet.setObjectType(ObjectType.Regular);
            sheet.setPosition(pos);
            sheet.snapToGround();
            sheet.setObjectType(ObjectType.Ground);

            process.nextTick(maybeFixZ);
        };
        process.nextTick(maybeFixZ);
    }

    clean() {
        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== sheetNsid) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupFactionSheet, FACTION_SHEET_POS };
