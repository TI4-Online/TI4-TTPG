const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

class SetupStartingUnits extends AbstractSetup {
    constructor(playerDesk, faction) {
        super(playerDesk, faction);
    }

    setup() {
        const playerSlot = this.playerDesk.playerSlot;
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
        }

        const startingUnits = this._faction.raw.startingUnits;
        let pos = this.playerDesk.center.add([0, 0, 10]);
        for (const [unit, count] of Object.entries(startingUnits)) {
            const bag = unitToBag[unit];
            assert(bag);
            assert(bag.getNumItems() >= count);
            for (let i = 0; i < count; i++) {
                bag.takeAt(0, pos, true);
                pos = pos.add([0, 0, 3]);
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
