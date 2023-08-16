const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { ObjectNamespace } = require("../object-namespace");
const { globalEvents, world } = require("../../wrapper/api");

const DEFAULT_BRIGHTNESS = 1.0;
let _brightness = undefined;

class SystemTileBrightness {
    static get() {
        if (_brightness !== undefined) {
            return _brightness;
        }
        _brightness = DEFAULT_BRIGHTNESS;

        // Do not use the world.TI4 system tile scanner, this can
        // be called before that is set up.
        const scanContained = true;
        for (const obj of world.getAllObjects(scanContained)) {
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const color = obj.getSecondaryColor();
            _brightness = color.r;
            break;
        }
        return _brightness;
    }

    static set(value) {
        assert(typeof value === "number");
        assert(value >= 0 && value <= 1);
        _brightness = value;
        SystemTileBrightness.updateAll();
    }

    static updateAll() {
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            SystemTileBrightness.maybeApply(obj);
        }
    }

    static maybeApply(obj) {
        if (!ObjectNamespace.isSystemTile(obj)) {
            return; // not a system tile
        }
        const parsed = ObjectNamespace.parseSystemTile(obj);
        if (!parsed || parsed.tile <= 0) {
            return; // anonymous tile
        }
        SystemTileBrightness.apply(obj);
    }

    static apply(systemTileObj) {
        assert(ObjectNamespace.isSystemTile(systemTileObj));
        const c = _brightness;
        const tint = [c, c, c, 1];
        ColorUtil.validate(tint);
        systemTileObj.setSecondaryColor(tint);
    }
}

// Load the current value.
SystemTileBrightness.get();

globalEvents.onObjectCreated.add((obj) => {
    SystemTileBrightness.maybeApply(obj);
});

// No need to touch this during reload, this value is persistent.
//if (world.getExecutionReason() === "ScriptReload") {
//    SystemTileBrightness.updateAll();
//}

module.exports = { SystemTileBrightness };
