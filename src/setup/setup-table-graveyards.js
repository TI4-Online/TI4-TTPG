const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { Rotator, Vector, world } = require("../wrapper/api");

const GRAVEYARD_POSITIONS = [
    { x: -52.5, y: 39 },
    { x: 52.5, y: 39 },
    { x: -52.5, y: -39 },
    { x: 52.5, y: -39 },
];

class SetupTableGraveyards extends AbstractSetup {
    setup() {
        const nsid = "bag:base/garbage";
        for (const posData of GRAVEYARD_POSITIONS) {
            const pos = new Vector(
                posData.x,
                posData.y,
                world.getTableHeight() + 1
            );
            const rot = new Rotator(0, 0, 0);
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setScale(new Vector(0.8, 0.8, 0.5));
        }
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
            obj.destroy();
        }
    }
}

module.exports = { SetupTableGraveyards };
