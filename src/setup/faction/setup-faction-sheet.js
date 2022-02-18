const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { ObjectType, Rotator, world } = require("../../wrapper/api");

const FACTION_SHEET = {
    pos: {
        x: -8,
        y: -6,
        z: 0,
    },
};

class SetupFactionSheet extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        const pos = this.playerDesk.localPositionToWorld(FACTION_SHEET.pos);
        const rot = new Rotator(0, 0, 180).compose(this.playerDesk.rot);
        const sheet = Spawn.spawn(sheetNsid, pos, rot);
        sheet.setObjectType(ObjectType.Ground);
        assert(ObjectNamespace.getNsid(sheet) === sheetNsid);
    }

    clean() {
        const sheetNsid = `sheet.faction:${this.faction.nsidSource}/${this.faction.nsidName}`;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === sheetNsid) {
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupFactionSheet, FACTION_SHEET };
