const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const GRAVEYARDS = {
    d: 89.8,
    yaw0: 126,
    dYaw: 36,
    count: 9,
    nsid: "bag:base/garbage",
};

if (TableLayout.getTableType() === "6p-skinny") {
    GRAVEYARDS.d = 65;
    GRAVEYARDS.yaw0 = 30;
    GRAVEYARDS.dYaw = 60;
    GRAVEYARDS.count = 6;
} else if (TableLayout.getTableType() === "8p-huge") {
    GRAVEYARDS.d = 160;
    GRAVEYARDS.yaw0 = 0;
    GRAVEYARDS.dYaw = 45;
    GRAVEYARDS.count = 8;
}

const EXTRA_GRAVEYARDS = [
    // on the side
    {
        nsid: "bag:base/garbage",
        anchor: TableLayout.anchor.strategy,
        pos: { x: 6, y: 25, z: 3 },
        yaw: 0,
    },
];

class SetupTableGraveyards extends AbstractSetup {
    setup() {
        for (let i = 0; i < GRAVEYARDS.count; i++) {
            const yaw = GRAVEYARDS.yaw0 + GRAVEYARDS.dYaw * i;
            const pos = new Vector(
                GRAVEYARDS.d,
                0,
                world.getTableHeight() + 1
            ).rotateAngleAxis(yaw, [0, 0, 1]);
            const rot = new Rotator(0, yaw, 0);
            const obj = Spawn.spawn(GRAVEYARDS.nsid, pos, rot);
            obj.setScale(new Vector(0.8, 0.8, 0.5));
            obj.setObjectType(ObjectType.Ground);
        }

        // Place one near the combat arena.
        EXTRA_GRAVEYARDS.forEach((data) => {
            const nsid = data.nsid;
            const pos = TableLayout.anchorPositionToWorld(
                data.anchor,
                data.pos
            );
            const rot = TableLayout.anchorRotationToWorld(
                data.anchor,
                new Rotator(0, data.yaw, 0)
            );
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setScale(new Vector(0.8, 0.8, 0.5));
            obj.setObjectType(ObjectType.Ground);
        });
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "bag:base/garbage") {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupTableGraveyards };
