const assert = require("../wrapper/assert");
const { Layout } = require("../lib/layout");
const { Setup } = require("./setup");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector } = require("../wrapper/api");

// Units in left-right bag order.
const UNIT_DATA = [
    {
        unitNsid: "unit:pok/mech",
        unitCount: 4,
    },
    {
        unitNsid: "unit:base/infantry",
        unitCount: 12,
    },
    {
        unitNsid: "unit:base/fighter",
        unitCount: 10,
    },
    {
        unitNsid: "unit:base/space_dock",
        unitCount: 3,
    },
    {
        unitNsid: "unit:base/pds",
        unitCount: 6,
    },
    {
        unitNsid: "unit:base/carrier",
        unitCount: 4,
    },
    {
        unitNsid: "unit:base/destroyer",
        unitCount: 8,
    },
    {
        unitNsid: "unit:base/cruiser",
        unitCount: 8,
    },
    {
        unitNsid: "unit:base/dreadnought",
        unitCount: 5,
    },
    {
        unitNsid: "unit:base/flagship",
        unitCount: 1,
    },
    {
        unitNsid: "unit:base/war_sun",
        unitCount: 2,
    },
];

const DISTANCE_BETWEEN_UNITS = 5.5;

class SetupUnits {
    static setupDesk(deskData) {
        // Desk center [-119.224, 6.05442]
        // Arc origin [-128.069, -8.963]
        // const tCenter = new Vector(-119.224, 6.05442, 0);
        // const tShelfCenter = new Vector(-113.441, -49.585, 0);
        // const tArcOrigin = new Vector(-128.069, -8.963, 0);
        // const d = tShelfCenter.subtract(tCenter);
        // console.log(`${d.x} ${d.y}`);

        const shelfCenter = new Vector(5.783, -55.639, 8)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);
        const arcOrigin = new Vector(-8.845, -15.017, 0)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(UNIT_DATA.length)
            .setDistanceBetween(DISTANCE_BETWEEN_UNITS)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        assert(UNIT_DATA.length == pointPosRots.length);
        for (let i = 0; i < UNIT_DATA.length; i++) {
            SetupUnits._setupUnit(deskData, UNIT_DATA[i], pointPosRots[i]);
        }
    }

    static _setupUnit(deskData, unitData, pointPosRot) {
        const unitNsid = unitData.unitNsid;
        const bagNsid = "bag." + unitNsid;

        const slotColor = Setup.getPlayerSlotColor(deskData.playerSlot);

        const bag = Spawn.spawn(bagNsid, pointPosRot.pos, pointPosRot.rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setOwningPlayerSlot(deskData.playerSlot);
        bag.setPrimaryColor(slotColor); // setting owning slot applies default, set again paranoia

        for (let i = 0; i < unitData.unitCount; i++) {
            const aboveBag = pointPosRot.pos.add([0, 0, 10 + i]);
            const unit = Spawn.spawn(unitNsid, aboveBag, pointPosRot.rot);
            unit.setOwningPlayerSlot(deskData.playerSlot);
            unit.setPrimaryColor(slotColor);
            bag.addObjects([unit]);
        }
    }
}

module.exports = { SetupUnits };
