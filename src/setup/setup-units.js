const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Layout } = require("../lib/layout");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

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

const SHELF_CENTER_LOCAL_OFFSET = { x: 0.03, y: -49, z: 5 };
const ARC_ORIGIN_LOCAL_OFFSET = { x: 0, y: 0, z: 5 };
const DISTANCE_BETWEEN_UNITS = 5.7;

const UNIT_SCALE = 0.8;

class SetupUnits extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        const shelfCenter = this.playerDesk.localPositionToWorld(
            SHELF_CENTER_LOCAL_OFFSET
        );
        const arcOrigin = this.playerDesk.localPositionToWorld(
            ARC_ORIGIN_LOCAL_OFFSET
        );

        // Use layout to find positions and rotations along an arc.
        const pointPosRots = new Layout()
            .setCount(UNIT_DATA.length)
            .setDistanceBetween(DISTANCE_BETWEEN_UNITS)
            .setCenter(shelfCenter)
            .layoutArc(arcOrigin)
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
            if (ObjectNamespace.isUnit(obj) || ObjectNamespace.isUnitBag(obj)) {
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
            const aboveBag = pointPosRot.pos.add([0, 0, 10 + i]);
            const unit = Spawn.spawn(unitNsid, aboveBag, pointPosRot.rot);
            unit.setOwningPlayerSlot(playerSlot);
            unit.setPrimaryColor(color);
            unit.setScale([UNIT_SCALE, UNIT_SCALE, UNIT_SCALE]);
            bag.addObjects([unit]);
        }
    }
}

module.exports = { SetupUnits };
