const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const SCALE = 0.8;

const SUPPLY_BOXES = [
    {
        tokenNsid: "token:base/tradegood_commodity_1",
        pos: { x: -14.364, y: 45.046, z: 4.309 },
        yaw: 72,
    },
    {
        tokenNsid: "token:base/tradegood_commodity_3",
        pos: { x: -23.113, y: 47.889, z: 4.309 },
        yaw: 72,
    },
];

class SetupSupplyBoxesDesks extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        for (const supplyBox of SUPPLY_BOXES) {
            this._setupBox(supplyBox);
        }
    }

    clean() {
        const bagNsids = new Set();
        for (const supplyBox of SUPPLY_BOXES) {
            const tokenNsid = supplyBox.tokenNsid;
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

    _setupBox(supplyBox) {
        // Find unit and bag.
        const bagNsid = "bag." + supplyBox.tokenNsid;

        const pos = this.playerDesk.localPositionToWorld(supplyBox.pos);
        const rot = this.playerDesk.localRotationToWorld(
            new Rotator(0, supplyBox.yaw, 0)
        );
        let bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setScale(new Vector(SCALE, SCALE, SCALE));
        bag.setType(1);

        // Supply box script now takes care of filling them.
    }
}

module.exports = { SetupSupplyBoxesDesks };
