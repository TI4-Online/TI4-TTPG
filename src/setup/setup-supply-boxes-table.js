const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Vector, world } = require("../wrapper/api");

const SCALE = 0.8;
const DISTANCE_BETWEEN_SUPPLY_BOXES = 11.5 * SCALE;

const SUPPLY_BOX_SETS = [
    {
        d: 99,
        yaw0: 162,
        dyaw: 72,
        count: 4,
        nsids: ["token:base/infantry_3", "token:base/infantry_1"],
    },
    {
        d: 99,
        yaw0: 126,
        dyaw: 72,
        count: 5,
        nsids: ["token:base/fighter_3", "token:base/fighter_1"],
    },
];

if (TableLayout.GET_TABLE() === "6p-skinny") {
    SUPPLY_BOX_SETS[0].d = 65 + DISTANCE_BETWEEN_SUPPLY_BOXES * 2;
    SUPPLY_BOX_SETS[0].yaw0 = 90;
    SUPPLY_BOX_SETS[0].dyaw = 180;
    SUPPLY_BOX_SETS[0].count = 2;
    SUPPLY_BOX_SETS[1].d = 65 + DISTANCE_BETWEEN_SUPPLY_BOXES;
    SUPPLY_BOX_SETS[1].yaw0 = 90;
    SUPPLY_BOX_SETS[1].dyaw = 180;
    SUPPLY_BOX_SETS[1].count = 2;
}

class SetupSupplyBoxesTable extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        for (const supplyData of SUPPLY_BOX_SETS) {
            for (let i = 0; i < supplyData.count; i++) {
                const yaw = supplyData.yaw0 + supplyData.dyaw * i;
                const pos = new Vector(
                    supplyData.d,
                    0,
                    world.getTableHeight() + 1
                ).rotateAngleAxis(yaw, [0, 0, 1]);
                const pointPosRots = new Layout()
                    .setCenter(pos)
                    .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
                    .setCount(supplyData.nsids.length)
                    .layoutLinear(yaw)
                    .getPoints();
                assert(pointPosRots.length === supplyData.nsids.length);
                supplyData.nsids.forEach((nsid, index) => {
                    const pointPosRot = pointPosRots[index];
                    this._setupBox(nsid, pointPosRot.pos, pointPosRot.rot);
                });
            }
        }
    }
    clean() {
        const bagNsids = new Set();
        for (const supplyData of SUPPLY_BOX_SETS) {
            for (const nsid of supplyData.nsids) {
                bagNsids.add(nsid);
            }
        }
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!bagNsids.has(nsid)) {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }

    _setupBox(tokenNsid, pos, rot) {
        // Find unit and bag.
        const bagNsid = "bag." + tokenNsid;

        let bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setScale(new Vector(SCALE, SCALE, SCALE));
        bag.setType(1);

        // Supply box script now takes care of filling them.
    }
}

module.exports = { SetupSupplyBoxesTable };
