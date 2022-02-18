const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const MATS = [
    {
        nsid: "mat:base/decks",
        pos: { x: -35, y: -50 },
        yaw: 180,
    },
    {
        nsid: "mat:base/laws",
        pos: { x: -19, y: -99 },
        yaw: 180,
    },
    {
        nsid: "mat:base/objectives_1",
        pos: { x: -20, y: -83 },
        yaw: 180,
    },
    {
        nsid: "mat:base/objectives_2",
        pos: { x: -20, y: -66 },
        yaw: 180,
    },
    {
        nsid: "mat:base/secrets",
        pos: { x: 20, y: -85 },
        yaw: 180,
    },
    {
        nsid: "mat:pok/exploration",
        pos: { x: 27, y: -50 },
        yaw: 180,
    },
    {
        nsid: "token:base/scoreboard",
        pos: { x: -20, y: -75 },
        yaw: 180,
    },
];

class SetupTableMats extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        MATS.forEach((matData) => {
            const nsid = matData.nsid;
            const pos = matData.pos;
            pos.z = world.getTableHeight() + 3;
            const rot = new Rotator(0, matData.yaw, 0);
            Spawn.spawn(nsid, pos, rot);
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
            obj.destroy();
        }
    }
}

module.exports = { SetupTableMats };
