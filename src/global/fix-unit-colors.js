/**
 * For some time we suggested players increase brightness to 1.2
 * Giving up on that, adjust colors to be brighter at the default brightness.
 *
 * Adjust any existing units and containers to the current color values.
 */

const { ColorUtil } = require("../lib/color/color-util");
const { ObjectNamespace } = require("../lib/object-namespace");
const assert = require("../wrapper/assert-wrapper");
const { world } = require("../wrapper/api");

function fixUnitColors() {
    const playerSlotToPlasticColor = {};
    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const slot = playerDesk.playerSlot;
        const color = playerDesk.plasticColor;
        assert(typeof slot === "number");
        assert(ColorUtil.isColor(color));
        playerSlotToPlasticColor[slot] = color;
    }

    const skipContained = false; // look inside containers
    for (const obj of world.getAllObjects(skipContained)) {
        const slot = obj.getOwningPlayerSlot();
        if (slot < 0) {
            continue; // anonymous
        }
        if (!ObjectNamespace.isUnit(obj) && !ObjectNamespace.isUnitBag(obj)) {
            continue; // not unit of unit bag
        }
        const color = playerSlotToPlasticColor[slot];
        if (!color) {
            continue; // owned by unseated player (how?)
        }
        obj.setPrimaryColor(color);
    }
}

fixUnitColors();
