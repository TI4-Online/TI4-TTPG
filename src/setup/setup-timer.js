const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, world } = require("../wrapper/api");

const TIMER = {
    nsid: "tool:base/timer",
    spawns: [
        {
            anchor: TableLayout.anchor.score,
            pos: { x: 25, y: -33, z: 3 },
            yaw: 0,
        },
    ],
};

class SetupTimer extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const nsid = TIMER.nsid;
        TIMER.spawns.forEach((data) => {
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
            if (nsid === TIMER.nsid) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupTimer };
