const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, world } = require("../wrapper/api");

const SUPPLY_BOXES_LEFT = {
    shelfCenter: { x: 2, y: -39, z: 0 },
    arcOrigin: { x: 0, y: 0, z: 0 },
    tokenNsids: [
        "token:base/infantry_1", // "bottom"
        "token:base/infantry_3",
        "token:base/fighter_1",
        "token:base/fighter_3",
    ],
};

const SUPPLY_BOXES_RIGHT = {
    shelfCenter: { x: 12, y: 37, z: 0 },
    arcOrigin: { x: 0, y: 0, z: 0 },
    tokenNsids: [
        "token:base/tradegood_commodity_3",
        "token:base/tradegood_commodity_1", // "bottom"
    ],
};

const DISTANCE_BETWEEN_SUPPLY_BOXES = 11.5;

class SetupSupplyBoxes extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        this._setupBoxes(SUPPLY_BOXES_LEFT);
        this._setupBoxes(SUPPLY_BOXES_RIGHT);
    }

    clean() {
        const bagNsids = new Set();
        for (const tokenNsid of SUPPLY_BOXES_LEFT.tokenNsids) {
            const bagNsid = "bag." + tokenNsid;
            bagNsids.add(bagNsid);
        }
        for (const tokenNsid of SUPPLY_BOXES_RIGHT.tokenNsids) {
            const bagNsid = "bag." + tokenNsid;
            bagNsids.add(bagNsid);
        }
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!bagNsids.has(nsid)) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.destroy();
        }
    }

    _setupBoxes(boxesData) {
        // Use layout to find positions and rotations along an arc.
        const shelfCenter = this.playerDesk.localPositionToWorld(
            boxesData.shelfCenter
        );
        const arcOrigin = this.playerDesk.localPositionToWorld(
            boxesData.arcOrigin
        );
        const pointPosRots = new Layout()
            .setCount(boxesData.tokenNsids.length)
            .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
            .getPoints();

        assert(boxesData.tokenNsids.length == pointPosRots.length);
        for (let i = 0; i < boxesData.tokenNsids.length; i++) {
            this._setupBox(boxesData.tokenNsids[i], pointPosRots[i]);
        }
    }

    _setupBox(tokenNsid, pointPosRot) {
        // Find unit and bag.
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
