const { Layout } = require("../lib/layout");
const { ObjectType, Vector, world } = require("../wrapper/api");
const assert = require("../wrapper/assert");
const TOKEN_NSID_TO_TEMPLATE_GUID = require("./spawn/template/nsid-token.json");
const BAG_NSID_TO_TEMPLATE_GUID = require("./spawn/template/nsid-bag-token.json");

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
    static setup(deskData) {
        let shelfCenter = new Vector(2.485, -46.844, 4.44)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);
        let arcOrigin = new Vector(-8.845, -15.017, 0)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);
        SetupSupplyBoxes._setupBoxesSubset(
            deskData,
            shelfCenter,
            arcOrigin,
            SUPPLY_BOXES_LEFT
        );

        shelfCenter = new Vector(-3.878, 33.346, 4.44)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);
        arcOrigin = new Vector(-9.003, 3.958, 0)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);
        SetupSupplyBoxes._setupBoxesSubset(
            deskData,
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
        const tokenTemplateId = TOKEN_NSID_TO_TEMPLATE_GUID[tokenNsid];
        if (!tokenTemplateId) {
            throw new Error(`cannot find ${tokenNsid}`);
        }

        const bagNsid = "bag." + tokenNsid;
        const bagTemplateId = BAG_NSID_TO_TEMPLATE_GUID[bagNsid];
        if (!bagTemplateId) {
            throw new Error(`cannot find ${bagNsid}`);
        }

        let bag = world.createObjectFromTemplate(
            bagTemplateId,
            pointPosRot.pos
        );
        assert(bag);
        bag.setRotation(pointPosRot.rot);
        bag.clear(); // just in case copied a full one
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
        const unit = world.createObjectFromTemplate(tokenTemplateId, aboveBag);
        assert(unit);
        bag.addObjects([unit]);
    }
}

module.exports = { SetupSupplyBoxes };
