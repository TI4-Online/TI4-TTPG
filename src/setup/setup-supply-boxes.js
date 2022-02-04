const { Layout } = require("../lib/layout");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector, world } = require("../wrapper/api");
const assert = require("../wrapper/assert");

const SUPPLY_BOXES_LEFT = [
    { nsid: "token:base/infantry_1" },
    { nsid: "token:base/infantry_3" },
    { nsid: "token:base/fighter_1" },
    { nsid: "token:base/fighter_3" },
];

const SUPPLY_BOXES_RIGHT = [
    { nsid: "token:base/tradegood_commodity_1" },
    { nsid: "token:base/tradegood_commodity_3" },
];

const DISTANCE_BETWEEN_SUPPLY_BOXES = 12;

class SetupSupplyBoxes {
    static setupDesk(playerDesk) {
        let shelfCenter = new Vector(2.485, -46.844, 4.44)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        let arcOrigin = new Vector(-8.845, -15.017, 0)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        SetupSupplyBoxes._setupBoxesSubset(
            playerDesk,
            shelfCenter,
            arcOrigin,
            SUPPLY_BOXES_LEFT
        );

        shelfCenter = new Vector(-3.878, 35, 3)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        arcOrigin = new Vector(-9.003, 3.958, 0)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        SetupSupplyBoxes._setupBoxesSubset(
            playerDesk,
            shelfCenter,
            arcOrigin,
            SUPPLY_BOXES_RIGHT
        );
    }

    static _setupBoxesSubset(deskData, shelfCenter, arcOrigin, supplyBoxes) {
        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(supplyBoxes.length)
            .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        assert(supplyBoxes.length == pointPosRots.length);
        for (let i = 0; i < supplyBoxes.length; i++) {
            SetupSupplyBoxes._setupBox(supplyBoxes[i], pointPosRots[i]);
        }
    }

    static _setupBox(supplyBox, pointPosRot) {
        // Find unit and bag.
        const tokenNsid = supplyBox.nsid;
        const bagNsid = "bag." + tokenNsid;

        let bag = Spawn.spawn(bagNsid, pointPosRot.pos, pointPosRot.rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);

        // Bag needs to have the correct type at create time.  If not infinite, fix and respawn.
        if (bag.getType() !== 1) {
            bag.setType(1);
            const json = bag.toJSONString();
            bag.destroy();
            bag = world.createObjectFromJSON(json, pointPosRot.pos);
            bag.setRotation(pointPosRot.rot);
        }

        const aboveBag = pointPosRot.pos.add([0, 0, 10]);
        const token = Spawn.spawn(tokenNsid, aboveBag, pointPosRot.rot);
        assert(token);
        bag.addObjects([token]);
    }
}

module.exports = { SetupSupplyBoxes };
