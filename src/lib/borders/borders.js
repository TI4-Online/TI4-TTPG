// Use line drawing for faction borders.
// 1. Get all plastic + control tokens
// 2. ???
// 3. Draw borders.
// Drawing circles on planets vs cutting up hexes is a lot simpler, start there.

const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../object-namespace");
const { UnitAttrsSet } = require("../unit/unit-attrs-set");
const { UnitPlastic } = require("../unit/unit-plastic");
const { world } = require("../../wrapper/api");

class Borders {
    constructor() {
        this._enabled = false;
        this._lines = undefined;
    }

    setEnabled(value) {
        assert(typeof value === "boolean");
        this._enabled = value;
        if (this._enabled) {
            this.update();
        } else if (this._lines) {
            // TODO XXX REMOVE LINES
            this._lines = undefined;
        }
    }

    update() {
        const spaceObjs = [];
        const planetObjs = [];

        const unitAttrsSet = new UnitAttrsSet();
        for (const unitPlastic of UnitPlastic.getAll()) {
            if (unitPlastic.owningPlayerSlot < 0) {
                continue;
            }
            const unitAttrs = unitAttrsSet.get(unitPlastic.unit);
            if (!unitAttrs) {
                throw new Error(`unknown unit "${unitPlastic.unit}"`);
            }
            if (unitAttrs.raw.structure || unitAttrs.raw.ground) {
                planetObjs.push(unitPlastic.gameObject);
            } else if (unitAttrs.raw.ship) {
                spaceObjs.push(unitPlastic.gameObject);
            } else {
                throw new Error(
                    `unit "${unitPlastic.unit}" is neither planet nor space?`
                );
            }
        }

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!ObjectNamespace.isControlToken(obj)) {
                continue;
            }
            planetObjs.push(obj);
        }

        const hexToSystemObject = [];
        for (const systemObject of world.TI4.getAllSystemTileObjects()) {
            const pos = systemObject.getPosition();
            const hex = Hex.fromPosition(pos);
            hexToSystemObject[hex] = systemObject;
        }
    }
}

module.exports = { Borders };
