const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { Container, Rotator, Vector, world } = require("../wrapper/api");

const BOXES = [
    {
        localeName: "bag.purge",
        templateId: "A44BAA604E0ED034CD67FA9502214AA7",
        pos: { x: 32, y: 113, z: 18 },
        yaw: 0,
    },
];

class SetupTableBoxes extends AbstractSetup {
    setup() {
        for (const boxData of BOXES) {
            const pos = new Vector(boxData.pos.x, boxData.pos.y, boxData.pos.z);
            const rot = new Rotator(0, boxData.yaw, 0);
            const container = world.createObjectFromTemplate(
                boxData.templateId,
                pos
            );
            assert(container instanceof Container);
            container.setRotation(rot, 0);
            const name = locale(boxData.localeName);
            container.setName(name);
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
