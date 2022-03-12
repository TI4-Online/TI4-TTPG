const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const MATS = [
    {
        nsid: "mat:base/objectives_1",
        anchor: TableLayout.anchor.score,
        pos: { x: 0, y: -10 },
        yaw: 0,
    },
    {
        nsid: "token:base/scoreboard",
        anchor: TableLayout.anchor.score,
        pos: { x: 0, y: 0 },
        yaw: 0,
    },
    {
        nsid: "mat:base/objectives_2",
        anchor: TableLayout.anchor.score,
        pos: { x: 0, y: 10 },
        yaw: 0,
    },

    {
        nsid: "mat:base/decks",
        anchor: TableLayout.anchor.score,
        pos: { x: 14, y: -30 }, // 16.9 width
        yaw: 0,
    },
    {
        nsid: "mat:pok/exploration",
        anchor: TableLayout.anchor.score,
        pos: { x: -10, y: -29 }, // 26 width
        yaw: 0,
    },

    //{
    //    nsid: "mat:base/laws",
    //    pos: { x: 0, y: 94 },
    //    yaw: 0,
    //},
    // {
    //     nsid: "mat:base/secrets",
    //     pos: { x: 20, y: -85 },
    //     yaw: 180,
    // },
    {
        nsid: "mat:base/strategy_card",
        anchor: TableLayout.anchor.strategy,
        pos: { x: 0, y: 0 },
        yaw: 0,
    },
];

class SetupTableMats extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        MATS.forEach((matData) => {
            const nsid = matData.nsid;
            let pos = new Vector(
                matData.pos.x,
                matData.pos.y,
                world.getTableHeight() + 3
            );
            let rot = new Rotator(0, matData.yaw, 0);
            if (matData.anchor) {
                pos = this.anchorPositionToWorld(matData.anchor, pos);
                rot = this.anchorRotationToWorld(matData.anchor, rot);
            }

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
            obj.destroy();
        }
    }
}

module.exports = { SetupTableMats, MATS };
