const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const MATS = [
    {
        nsid: "mat:base/agenda",
        anchor: TableLayout.anchor.score,
        pos: { x: 25, y: 0 },
        yaw: -90,
        nonInteractive: true,
    },
    {
        nsid: "mat:base/agenda_predictions",
        anchor: TableLayout.anchor.score,
        pos: { x: 36, y: 0 },
        yaw: 0,
        nonInteractive: true,
    },
    {
        nsid: "mat:base/custodians",
        anchor: TableLayout.anchor.score,
        pos: { x: 25, y: 27 },
        yaw: 0,
        nonInteractive: true,
    },
    {
        nsid: "mat:base/objectives_1",
        anchor: TableLayout.anchor.score,
        pos: { x: 10, y: 0 },
        yaw: -90,
        nonInteractive: true,
    },
    {
        nsid: "token:base/scoreboard",
        anchor: TableLayout.anchor.score,
        pos: { x: 0, y: 0 },
        yaw: -90,
    },
    {
        nsid: "mat:base/objectives_2",
        anchor: TableLayout.anchor.score,
        pos: { x: -10, y: 0 },
        yaw: -90,
        nonInteractive: true,
    },

    {
        nsid: "mat:base/decks",
        anchor: TableLayout.anchor.score,
        pos: { x: -30, y: 8 }, // 16.9 width
        yaw: -90,
        nonInteractive: true,
    },
    {
        nsid: "mat:pok/exploration",
        anchor: TableLayout.anchor.score,
        pos: { x: -28.9, y: -16 }, // 26 width
        yaw: -90,
        nonInteractive: true,
    },
    {
        nsid: "mat:base/faction_card",
        anchor: TableLayout.anchor.score,
        pos: { x: -28, y: 24 },
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
        yaw: -90,
        nonInteractive: true,
    },
];

class SetupTableMats extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        MATS.forEach((matData) => {
            const nsid = matData.nsid;
            let pos = new Vector(matData.pos.x, matData.pos.y, 0);
            let rot = new Rotator(0, matData.yaw, 0);
            if (matData.anchor) {
                pos = TableLayout.anchorPositionToWorld(matData.anchor, pos);
                rot = TableLayout.anchorRotationToWorld(matData.anchor, rot);
            }
            pos.z = world.getTableHeight() + 3;

            const obj = Spawn.spawn(nsid, pos, rot);
            obj.snapToGround();
            obj.setObjectType(ObjectType.Ground);

            if (matData.nonInteractive) {
                obj.setObjectType(ObjectType.NonInteractive);
            }
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
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupTableMats, MATS };
