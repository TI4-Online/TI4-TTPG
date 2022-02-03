const { Layout } = require("../lib/layout");
const { ObjectType, Vector, world } = require("../wrapper/api");
const assert = require("../wrapper/assert");
const UNIT_NSID_TO_TEMPLATE_GUID = require("./spawn/template/nsid-unit.json");
const BAG_NSID_TO_TEMPLATE_GUID = require("./spawn/template/nsid-bag-unit.json");

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
    static setup(deskData) {
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
        const unitTemplateId = UNIT_NSID_TO_TEMPLATE_GUID[unitNsid];
        if (!unitTemplateId) {
            throw new Error(`cannot find ${unitNsid}`);
        }
        const bagNsid = "bag." + unitNsid;
        const bagTemplateId = BAG_NSID_TO_TEMPLATE_GUID[bagNsid];
        if (!bagTemplateId) {
            throw new Error(`cannot find ${bagNsid}`);
        }

        const bag = world.createObjectFromTemplate(
            bagTemplateId,
            pointPosRot.pos
        );
        assert(bag);
        bag.setRotation(pointPosRot.rot);
        bag.clear(); // just in case copied a full one
        bag.setObjectType(ObjectType.Ground);
        bag.setOwningPlayerSlot(deskData.playerSlot);
        const tint = bag.getPrimaryColor();

        for (let i = 0; i < unitData.unitCount; i++) {
            const aboveBag = pointPosRot.pos.add([0, 0, 10 + i]);
            const unit = world.createObjectFromTemplate(
                unitTemplateId,
                aboveBag
            );
            assert(unit);
            unit.setOwningPlayerSlot(deskData.playerSlot);
            unit.setPrimaryColor(tint);
            bag.addObjects([unit]);
        }
    }
}

module.exports = { SetupUnits };
