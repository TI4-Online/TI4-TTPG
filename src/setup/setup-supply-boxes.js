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

const LEFT_SHELF_CENTER_LOCAL_OFFSET = { x: 2.485, y: -46.844, z: 5 };
const RIGHT_SHELF_CENTER_LOCAL_OFFSET = { x: -3.878, y: 35, z: 5 };
const LEFT_ARC_ORIGIN_LOCAL_OFFSET = { x: -8.845, y: -15.017, z: 5 };
const RIGHT_ARC_ORIGIN_LOCAL_OFFSET = { x: -9.003, y: 3.958, z: 5 };
const DISTANCE_BETWEEN_SUPPLY_BOXES = 12;

class SetupSupplyBoxes {
    static setupDesk(playerDesk) {
        let o = LEFT_SHELF_CENTER_LOCAL_OFFSET;
        let shelfCenter = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        o = LEFT_ARC_ORIGIN_LOCAL_OFFSET;
        let arcOrigin = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        SetupSupplyBoxes._setupBoxesSubset(
            playerDesk,
            shelfCenter,
            arcOrigin,
            SUPPLY_BOXES_LEFT
        );

        o = RIGHT_SHELF_CENTER_LOCAL_OFFSET;
        shelfCenter = new Vector(o.x, o.y, o.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);
        o = RIGHT_ARC_ORIGIN_LOCAL_OFFSET;
        arcOrigin = new Vector(o.x, o.y, o.z)
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
