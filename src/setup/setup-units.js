const assert = require("../wrapper/assert-wrapper");
const { Layout } = require("../lib/layout");
const { Spawn } = require("./spawn/spawn");
const { ObjectType } = require("../wrapper/api");
const { AbstractSetup } = require("./abstract-setup");

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

// OLD: thinner shelf.
//const SHELF_CENTER_LOCAL_OFFSET = { x: 5.783, y: -55.639, z: 8 };
//const ARC_ORIGIN_LOCAL_OFFSET = { x: -8.845, y: -15.017, z: 0 };
// NEW: wider shelf (2/8/2022)
const SHELF_CENTER_LOCAL_OFFSET = { x: 6.3, y: -57.44, z: 8 };
const ARC_ORIGIN_LOCAL_OFFSET = { x: -9.82, y: -12.65, z: 0 };
const DISTANCE_BETWEEN_UNITS = 5.5;

const UNIT_SCALE = 0.9;

class SetupUnits extends AbstractSetup {
    constructor(playerDesk) {
        super();
        this.setPlayerDesk(playerDesk);
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

    _setupUnit(unitData, pointPosRot) {
        const unitNsid = unitData.unitNsid;
        const bagNsid = "bag." + unitNsid;

        const color = this.playerDesk.color;
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
