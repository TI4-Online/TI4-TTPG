const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Layout } = require("../lib/layout");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

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

const EDGE_YAW = 18;
const DISTANCE_BETWEEN_UNITS = 5.7;
const UNIT_SCALE = 0.8;

class SetupUnits extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        // Compute center by rotating the desk center to match desk edge.
        let shelfCenter = this.playerDesk.center
            .multiply(1.03)
            .rotateAngleAxis(EDGE_YAW, [0, 0, 1]);
        shelfCenter.z = world.getTableHeight() + 5;

        // Move it closer to desk center.
        shelfCenter = Vector.interpolateTo(
            shelfCenter,
            this.playerDesk.center,
            1,
            DISTANCE_BETWEEN_UNITS * 0.02
        );

        //.add([0, DISTANCE_BETWEEN_UNITS * 0.5 + 2, 0]);
        const rot = new Rotator(0, EDGE_YAW - 90, 0).compose(
            this.playerDesk.rot
        );

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(UNIT_DATA.length)
            .setDistanceBetween(DISTANCE_BETWEEN_UNITS)
            .setCenter(shelfCenter)
            .layoutLinear(rot.yaw)
            .getPoints();

        assert(UNIT_DATA.length == pointPosRots.length);
        for (let i = 0; i < UNIT_DATA.length; i++) {
            this._setupUnit(UNIT_DATA[i], pointPosRots[i]);
        }
    }

    clean() {
        const playerSlot = this.playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            if (ObjectNamespace.isUnitBag(obj)) {
                for (const inner of obj.getItems()) {
                    inner.setTags(["DELETED_ITEMS_IGNORE"]);
                }
                obj.clear();
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            } else if (ObjectNamespace.isUnit(obj)) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }
    }

    _setupUnit(unitData, pointPosRot) {
        const unitNsid = unitData.unitNsid;
        const bagNsid = "bag." + unitNsid;

        const color = this.playerDesk.plasticColor;
        const playerSlot = this.playerDesk.playerSlot;

        const bag = Spawn.spawn(bagNsid, pointPosRot.pos, pointPosRot.rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Ground);
        bag.setOwningPlayerSlot(playerSlot);
        bag.setPrimaryColor(color); // setting owning slot applies default, set again paranoia

        for (let i = 0; i < unitData.unitCount; i++) {
            const aboveBag = pointPosRot.pos.add([0, 0, 10 + i * 3]);
            const unit = Spawn.spawn(unitNsid, aboveBag, pointPosRot.rot);
            unit.setOwningPlayerSlot(playerSlot);
            unit.setPrimaryColor(color);
            unit.setScale([UNIT_SCALE, UNIT_SCALE, UNIT_SCALE]);
            if (
                unitNsid === "unit:base/infantry" ||
                unitNsid === "unit:base/fighter"
            ) {
                // Units most likely to be dropped on stacks of tokens.
                // The default value (0.3) seems fine, but higher values
                // definitely bounce off -- make these not bouncy.
                unit.setBounciness(0);
            }
            bag.addObjects([unit]);
        }
    }
}
//
module.exports = { SetupUnits, UNIT_DATA };
