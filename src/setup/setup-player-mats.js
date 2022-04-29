const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector, world } = require("../wrapper/api");

const PLANETS_X = -7;
const PLANETS_Y = -7;
const MATS = [
    {
        nsid: "mat:base/planets",
        pos: { x: PLANETS_X, y: PLANETS_Y },
    },
    {
        nsid: "mat:base/tech",
        pos: { x: PLANETS_X - 4.12, y: PLANETS_Y + 28 },
    },
    {
        nsid: "mat:base/build_area",
        pos: { x: PLANETS_X - 4.12, y: PLANETS_Y - 20 },
    },
];

class SetupPlayerMats extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        MATS.forEach((matData) => {
            let pos = new Vector(matData.pos.x, matData.pos.y, 2);
            pos = this.playerDesk.localPositionToWorld(pos);
            const rot = this.playerDesk.rot;

            const nsid = matData.nsid;
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
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupPlayerMats };
