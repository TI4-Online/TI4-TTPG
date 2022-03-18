const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, world } = require("../wrapper/api");

const QUICK_ROLLER = {
    nsid: "tool:base/quick_roller",
    spawns: [
        {
            anchor: TableLayout.anchor.strategy,
            pos: { x: -10, y: -35, z: 3 },
            yaw: 0,
        },
    ],
};

class SetupQuickRollers extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const nsid = QUICK_ROLLER.nsid;
        QUICK_ROLLER.spawns.forEach((data) => {
            const pos = this.anchorPositionToWorld(data.anchor, data.pos);
            const rot = this.anchorRotationToWorld(
                data.anchor,
                new Rotator(0, data.yaw, 0)
            );
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setObjectType(ObjectType.Ground);
        });
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === QUICK_ROLLER.nsid) {
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupQuickRollers };
