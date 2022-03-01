const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector, world } = require("../wrapper/api");

const MATS = [
    {
        nsid: "mat:base/planets",
        pos: { x: 38.5, y: 15.74 },
    },
    {
        nsid: "mat:base/tech",
        pos: { x: 42.62, y: -12.34 },
    },
];

class SetupPlayerMats extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        MATS.forEach((matData) => {
            const nsid = matData.nsid;
            const pos = this.playerDesk.localPositionToWorld(
                new Vector(matData.pos.x, matData.pos.y, 0)
            );
            pos.z = world.getTableHeight() + 3;
            const rot = this.playerDesk.rot;
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setObjectType(ObjectType.Ground);
        });
    }
    clean() {
        const destroyNsids = new Set();
        MATS.forEach((matData) => {
            destroyNsids.add(matData.nsid);
        });
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!destroyNsids.has(nsid)) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.destroy();
        }
    }
}

module.exports = { SetupPlayerMats };
