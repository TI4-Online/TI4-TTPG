const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Container, ObjectType, Vector, world } = require("../wrapper/api");
const assert = require("../wrapper/assert");

const SUPPLY_BOXES_LEFT = [
    "token:base/infantry_1",
    "token:base/infantry_3",
    "token:base/fighter_1",
    "token:base/fighter_3",
];

const SUPPLY_BOXES_RIGHT = [
    "token:base/tradegood_commodity_1",
    "token:base/tradegood_commodity_3",
];

const DISTANCE_BETWEEN_SUPPLY_BOXES = 12;

class SetupSupplyBoxes {
    static setupLeft(deskCenter, deskRot) {
        let shelfCenter = new Vector(2.485, -46.844, 4.44);
        let arcOrigin = new Vector(-8.845, -15.017, 0);
        shelfCenter = shelfCenter.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        shelfCenter = shelfCenter.add(deskCenter);
        arcOrigin = arcOrigin.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        arcOrigin = arcOrigin.add(deskCenter);

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(SUPPLY_BOXES_LEFT.length)
            .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        const setupPlans = [];
        for (let i = 0; i < SUPPLY_BOXES_LEFT.length; i++) {
            const pointPosRot = pointPosRots[i];
            setupPlans.push({
                tokenNsid: SUPPLY_BOXES_LEFT[i],
                pos: pointPosRot.pos,
                rot: pointPosRot.rot,
            });
        }

        this._doSetup(setupPlans);
    }

    static setupRight(deskCenter, deskRot) {
        let shelfCenter = new Vector(-3.878, 33.346, 4.44);
        let arcOrigin = new Vector(-9.003, 3.958, 0);
        shelfCenter = shelfCenter.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        shelfCenter = shelfCenter.add(deskCenter);
        arcOrigin = arcOrigin.rotateAngleAxis(deskRot.yaw, [0, 0, 1]);
        arcOrigin = arcOrigin.add(deskCenter);

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(SUPPLY_BOXES_RIGHT.length)
            .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        const setupPlans = [];
        for (let i = 0; i < SUPPLY_BOXES_RIGHT.length; i++) {
            const pointPosRot = pointPosRots[i];
            setupPlans.push({
                tokenNsid: SUPPLY_BOXES_RIGHT[i],
                pos: pointPosRot.pos,
                rot: pointPosRot.rot,
            });
        }

        this._doSetup(setupPlans);
    }

    static _doSetup(setupPlans) {
        const setupNext = () => {
            const setupPlan = setupPlans.pop();
            if (!setupPlan) {
                return false;
            }

            // Find unit and bag.
            const tokenNsid = setupPlan.tokenNsid;
            const bagNsid = "bag." + tokenNsid;

            let tokenJson = false;
            let bagJson = false;
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === tokenNsid && !tokenJson) {
                    tokenJson = obj.toJSONString();
                }
                if (nsid === bagNsid && !bagJson) {
                    assert(obj instanceof Container);
                    obj.setType(1); // infinite
                    bagJson = obj.toJSONString();
                }
            }
            if (!tokenJson) {
                throw new Error(`cannot find ${tokenNsid}`);
            }
            if (!bagJson) {
                throw new Error(`cannot find ${bagNsid}`);
            }

            const bag = world.createObjectFromJSON(bagJson, setupPlan.pos);
            assert(bag);
            assert(bag.getType() === 1);
            bag.setRotation(setupPlan.rot);
            bag.clear(); // just in case copied a full one
            bag.setObjectType(ObjectType.Ground);

            const aboveBag = setupPlan.pos.add([0, 0, 10]);
            const unit = world.createObjectFromJSON(tokenJson, aboveBag);
            assert(unit);
            bag.addObjects([unit]);

            return true;
        };
        const chainSetup = () => {
            if (setupNext()) {
                setTimeout(chainSetup, 100);
            } else {
                // finished, callback?
            }
        };
        chainSetup();
    }
}

module.exports = { SetupSupplyBoxes };
