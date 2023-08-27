const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, world } = require("../wrapper/api");
const { UnitAttrs } = require("../lib/unit/unit-attrs");

// Units in left-right bag order.
const UNIT_DATA = [
    {
        unitNsid: "unit:pok/mech",
        pos: { x: -24.498, y: -49.464, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/infantry",
        pos: { x: -19.077, y: -47.702, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/fighter",
        pos: { x: -13.656, y: -45.941, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/space_dock",
        pos: { x: -8.235, y: -44.18, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/pds",
        pos: { x: -2.814, y: -42.418, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/carrier",
        pos: { x: 2.607, y: -40.657, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/destroyer",
        pos: { x: 8.028, y: -38.895, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/cruiser",
        pos: { x: 13.449, y: -37.134, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/dreadnought",
        pos: { x: 18.87, y: -35.373, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/flagship",
        pos: { x: 24.291, y: -33.611, z: 4.43 },
        yaw: -72.001,
    },
    {
        unitNsid: "unit:base/war_sun",
        pos: { x: 29.712, y: -31.85, z: 4.43 },
        yaw: -72.001,
    },
];

class SetupUnits extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        for (let i = 0; i < UNIT_DATA.length; i++) {
            this._setupUnit(UNIT_DATA[i]);
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

    _setupUnit(unitData) {
        const unitNsid = unitData.unitNsid;
        const bagNsid = "bag." + unitNsid;

        const color = this.playerDesk.plasticColor;
        const playerSlot = this.playerDesk.playerSlot;

        const pos = this.playerDesk.localPositionToWorld(unitData.pos);
        const rot = this.playerDesk.localRotationToWorld(
            new Rotator(0, unitData.yaw, 0)
        );

        const bag = Spawn.spawn(bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.snapToGround();
        bag.setObjectType(ObjectType.Ground);
        bag.setOwningPlayerSlot(playerSlot);
        bag.setPrimaryColor(color); // setting owning slot applies default, set again paranoia

        const parsed = ObjectNamespace.parseNsid(unitNsid);
        const unit = parsed.name;
        const unitAttrs = UnitAttrs.getDefaultUnitAttrs(unit);
        const unitCount = unitAttrs.raw.unitCount;

        for (let i = 0; i < unitCount; i++) {
            const aboveBag = pos.add([0, 0, 10 + i * 3]);
            const unit = Spawn.spawn(unitNsid, aboveBag, rot);
            unit.setOwningPlayerSlot(playerSlot);
            unit.setPrimaryColor(color);
            bag.addObjects([unit]);
        }
    }
}
//
module.exports = { SetupUnits };
