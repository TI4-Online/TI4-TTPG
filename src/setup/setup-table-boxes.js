const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const {
    Container,
    ObjectType,
    Rotator,
    Vector,
    world,
} = require("../wrapper/api");

const BOXES = [
    {
        nsid: "bag:base/generic",
        localeName: "bag.purge",
        anchor: TableLayout.anchor.score,
        pos: { x: -50, y: -9, z: 3 },
        yaw: 0,
        scale: { x: 0.8, y: 0.8, z: 0.5 },
    },
];

class SetupTableBoxes extends AbstractSetup {
    setup() {
        for (const boxData of BOXES) {
            let pos = new Vector(boxData.pos.x, boxData.pos.y, 0);
            let rot = new Rotator(0, boxData.yaw, 0);
            if (boxData.anchor) {
                pos = this.anchorPositionToWorld(boxData.anchor, pos);
                rot = this.anchorRotationToWorld(boxData.anchor, rot);
            }
            pos.z = world.getTableHeight() + boxData.pos.z;

            const container = Spawn.spawn(boxData.nsid, pos, rot);
            assert(container instanceof Container);
            container.setObjectType(ObjectType.Ground);
            const name = locale(boxData.localeName);
            container.setName(name);

            if (boxData.scale) {
                container.setScale(
                    new Vector(
                        boxData.scale.x,
                        boxData.scale.y,
                        boxData.scale.z
                    )
                );
            }
        }
    }

    clean() {
        const nameSet = new Set();
        for (const boxData of BOXES) {
            const name = locale(boxData.localeName);
            nameSet.add(name);
        }
        for (const obj of world.getAllObjects()) {
            if (!(obj instanceof Container)) {
                continue;
            }
            const name = obj.getName();
            if (!nameSet.has(name)) {
                continue;
            }
            obj.destroy();
        }
    }
}

module.exports = { SetupTableBoxes };
