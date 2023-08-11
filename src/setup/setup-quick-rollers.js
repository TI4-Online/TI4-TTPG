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
            pos: { x: 6, y: -25, z: 3 },
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
            const pos = TableLayout.anchorPositionToWorld(
                data.anchor,
                data.pos
            );
            const rot = TableLayout.anchorRotationToWorld(
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
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupQuickRollers };
