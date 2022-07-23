const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const EDGE_YAW = -18;
const SCALE = 0.8;
const DISTANCE_BETWEEN_SUPPLY_BOXES = 11.5 * SCALE;

const SUPPLY_BOXES_RIGHT = {
    tokenNsids: [
        "token:base/tradegood_commodity_1",
        "token:base/tradegood_commodity_3",
    ],
};

class SetupSupplyBoxesDesks extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        // Compute center by rotating the desk center to match desk edge.
        let shelfCenter = this.playerDesk.center
            .multiply(1.21)
            .rotateAngleAxis(EDGE_YAW, [0, 0, 1]);
        shelfCenter.z = world.getTableHeight() + 5;

        // Move it closer to desk center.
        shelfCenter = Vector.interpolateTo(
            shelfCenter,
            this.playerDesk.center,
            1,
            DISTANCE_BETWEEN_SUPPLY_BOXES * 0.015
        );

        const rot = new Rotator(0, EDGE_YAW + 90, 0).compose(
            this.playerDesk.rot
        );

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(SUPPLY_BOXES_RIGHT.tokenNsids.length)
            .setDistanceBetween(DISTANCE_BETWEEN_SUPPLY_BOXES)
            .setCenter(shelfCenter)
            .layoutLinear(rot.yaw)
            .getPoints();
        assert(pointPosRots.length === SUPPLY_BOXES_RIGHT.tokenNsids.length);
        for (let i = 0; i < SUPPLY_BOXES_RIGHT.tokenNsids.length; i++) {
            this._setupBox(SUPPLY_BOXES_RIGHT.tokenNsids[i], pointPosRots[i]);
        }
    }

    clean() {
        const bagNsids = new Set();
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
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }

    _setupBox(tokenNsid, pointPosRot) {
        // Find unit and bag.
        const bagNsid = "bag." + tokenNsid;

        let bag = Spawn.spawn(bagNsid, pointPosRot.pos, pointPosRot.rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setScale(new Vector(SCALE, SCALE, SCALE));
        bag.setType(1);

        // Supply box script now takes care of filling them.
    }
}

module.exports = { SetupSupplyBoxesDesks };
