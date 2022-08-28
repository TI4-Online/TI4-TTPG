const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { globalEvents, world } = require("../../wrapper/api");

let _brightness = 1.0;

class SystemTileBrightness {
    static get() {
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
        systemTileObj.setSecondaryColor(tint);
    }
}

globalEvents.onObjectCreated.add((obj) => {
    SystemTileBrightness.maybeApply(obj);
});

// No need to touch this during reload, this value is persistent.
//if (world.getExecutionReason() === "ScriptReload") {
//    SystemTileBrightness.updateAll();
//}

module.exports = { SystemTileBrightness };
