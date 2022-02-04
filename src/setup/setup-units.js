const assert = require("../wrapper/assert");
const { Layout } = require("../lib/layout");
const { PlayerArea } = require("../lib/player-area");
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

const SHELF_CENTER_LOCAL_OFFSET = { x: 5.783, y: -55.639, z: 8 };
const ARC_ORIGIN_LOCAL_OFFSET = { x: -8.845, y: -15.017, z: 0 };
const DISTANCE_BETWEEN_UNITS = 5.5;

class SetupUnits {
    static setupDesk(playerDesk) {
        // Desk center [-119.224, 6.05442]
        // Arc origin [-128.069, -8.963]
        // const tCenter = new Vector(-119.224, 6.05442, 0);
        // const tShelfCenter = new Vector(-113.441, -49.585, 0);
        // const tArcOrigin = new Vector(-128.069, -8.963, 0);
        // const d = tShelfCenter.subtract(tCenter);
        // console.log(`${d.x} ${d.y}`);

        let o = SHELF_CENTER_LOCAL_OFFSET;
        const shelfCenter = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        o = ARC_ORIGIN_LOCAL_OFFSET;
        const arcOrigin = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(UNIT_DATA.length)
            .setDistanceBetween(DISTANCE_BETWEEN_UNITS)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        assert(UNIT_DATA.length == pointPosRots.length);
        for (let i = 0; i < UNIT_DATA.length; i++) {
            SetupUnits._setupUnit(playerDesk, UNIT_DATA[i], pointPosRots[i]);
        }
    }

    static _setupUnit(deskData, unitData, pointPosRot) {
        const unitNsid = unitData.unitNsid;
        const bagNsid = "bag." + unitNsid;

        const slotColor = PlayerArea.getPlayerSlotColor(deskData.playerSlot);

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
