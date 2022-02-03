const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { ObjectType, Vector, world } = require("../wrapper/api");
const assert = require("../wrapper/assert");

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
    static setup(deskCenter, deskRot, playerSlot) {
        // Desk center [-119.224, 6.05442]
        // Arc origin [-128.069, -8.963]
        // const tCenter = new Vector(-119.224, 6.05442, 0);
        // const tShelfCenter = new Vector(-113.441, -49.585, 0);
        // const tArcOrigin = new Vector(-128.069, -8.963, 0);
        // const d = tShelfCenter.subtract(tCenter);
        // console.log(`${d.x} ${d.y}`);

        let shelfCenter = new Vector(5.783, -55.639, 8);
        let arcOrigin = new Vector(-8.845, -15.017, 0);
        shelfCenter = shelfCenter.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        shelfCenter = shelfCenter.add(deskCenter);
        arcOrigin = arcOrigin.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        arcOrigin = arcOrigin.add(deskCenter);

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(UNIT_DATA.length)
            .setDistanceBetween(DISTANCE_BETWEEN_UNITS)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        const setupPlans = [];
        for (let i = 0; i < UNIT_DATA.length; i++) {
            const unitData = UNIT_DATA[i];
            const pointPosRot = pointPosRots[i];
            setupPlans.push({
                unitData: unitData,
                pos: pointPosRot.pos,
                rot: pointPosRot.rot,
            });
        }
        console.log(setupPlans.length);

        const setupNext = () => {
            const setupPlan = setupPlans.pop();
            if (!setupPlan) {
                return false;
            }

            // Find unit and bag.
            const unitNsid = setupPlan.unitData.unitNsid;
            const bagNsid = "bag." + unitNsid;

            let unitJson = false;
            let bagJson = false;
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === unitNsid && !unitJson) {
                    unitJson = obj.toJSONString();
                }
                if (nsid === bagNsid && !bagJson) {
                    bagJson = obj.toJSONString();
                }
            }
            if (!unitJson) {
                console.error(`SetupUnits cannot find unit ${unitNsid}`);
                throw new Error(`SetupUnits cannot find unit ${unitNsid}`);
            }
            if (!bagJson) {
                console.log(`SetupUnits cannot find bag ${bagNsid}`);
                throw new Error(`SetupUnits cannot find bag ${bagNsid}`);
            }

            const bag = world.createObjectFromJSON(bagJson, setupPlan.pos);
            if (!bag) {
                console.log(`FAIL ${world.getAllObjects().length}`);
                return false;
            }
            assert(bag);
            bag.setRotation(setupPlan.rot);
            bag.clear(); // just in case copied a full one
            bag.setObjectType(ObjectType.Ground);
            bag.setOwningPlayerSlot(playerSlot);
            const tint = bag.getPrimaryColor();

            for (let i = 0; i < setupPlan.unitData.unitCount; i++) {
                const aboveBag = setupPlan.pos.add([0, 0, 10 + i]);
                const unit = world.createObjectFromJSON(unitJson, aboveBag);
                assert(unit);
                unit.setOwningPlayerSlot(playerSlot);
                unit.setPrimaryColor(tint);
                bag.addObjects([unit]);
            }

            return true;
        };
        const chainSetup = () => {
            if (setupNext()) {
                setTimeout(chainSetup, 100);
            } else {
                console.log(`PASS ${world.getAllObjects().length}`);
            }
        };
        chainSetup();
    }
}

module.exports = { SetupUnits };
