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
        pos.z = world.getTableHeight() + 1;
        const rot = this.playerDesk.rot;

        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        const sheet = Spawn.spawn(sheetNsid, pos, rot);
        sheet.setObjectType(ObjectType.Ground);
        const objNsid = ObjectNamespace.getNsid(sheet);
        if (objNsid !== sheetNsid) {
            throw new Error(
                `SetupFactionSheet: sheet has nsid "${objNsid}", expected "${sheetNsid}"`
            );
        }
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
