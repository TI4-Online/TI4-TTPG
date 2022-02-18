const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const { Vector, world } = require("../../wrapper/api");

class SetupStartingUnits extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const playerSlot = this.playerDesk.playerSlot;
        const homeSystemNsid = `tile.system:${this.faction.nsidSource}/${this.faction.raw.home}`;
        const startingUnits = this.faction.raw.startingUnits;

        let homeSystemObj = false;
        const unitToBag = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            } else if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            if (ObjectNamespace.isUnitBag(obj)) {
                const parsed = ObjectNamespace.parseUnitBag(obj);
                unitToBag[parsed.unit] = obj;
            }
            if (ObjectNamespace.getNsid(obj) === homeSystemNsid) {
                homeSystemObj = obj;
            }
        }

        // Make sure all bags exist before doing anything.
        const units = UnitAttrs.getAllUnitTypes();
        for (const unit of units) {
            const bag = unitToBag[unit];
            if (!bag) {
                console.warn("SetupStartingUnits: missing unit bags");
                return;
            }
            if (bag.getNumItems() < (startingUnits[unit] || 0)) {
                console.warn("SetupStartingUnits: not enough units in bags");
                return;
            }
        }
        if (!homeSystemObj) {
            console.warn("SetupStartingUnits: missing home system");
            return;
        }

        let totalCount = 0;
        for (const count of Object.values(startingUnits)) {
            totalCount += count;
        }
        const rotate = 360 / Math.max(totalCount, 1);

        let localPos = new Vector(3, 0, 2);
        for (const [unit, count] of Object.entries(startingUnits)) {
            const bag = unitToBag[unit];
            assert(bag);
            assert(bag.getNumItems() >= count);
            for (let i = 0; i < count; i++) {
                const pos = homeSystemObj.localPositionToWorld(localPos);
                bag.takeAt(0, pos, true);
                localPos = localPos.rotateAngleAxis(rotate, [0, 0, 1]);
            }
        }
    }

    clean() {
        const playerSlot = this.playerDesk.playerSlot;
        const unitToBag = {};
        const units = [];

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            if (ObjectNamespace.isUnitBag(obj)) {
                const parsed = ObjectNamespace.parseUnitBag(obj);
                unitToBag[parsed.unit] = obj;
            }
            if (ObjectNamespace.isUnit(obj)) {
                units.push(obj);
            }
        }

        for (const obj of units) {
            const parsed = ObjectNamespace.parseUnit(obj);
            const bag = unitToBag[parsed.unit];
            assert(bag);
            bag.addObjects([obj]);
        }
    }
}

module.exports = { SetupStartingUnits };
