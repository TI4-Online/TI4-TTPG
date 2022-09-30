const assert = require("../wrapper/assert-wrapper");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../lib/saved-data/global-saved-data");
const { Rotator, Vector, world } = require("../wrapper/api");

// The table layout file is fixed to the table model.
// At the time of this writing, TTPG has no way to tell which table is in use.
// Store it in a global variable.  YUCK.
const DEFAULT_TABLE_JS_FILE = "8p-2x-common-ext";
const tableJsFile = GlobalSavedData.get(
    GLOBAL_SAVED_DATA_KEY.TABLE,
    DEFAULT_TABLE_JS_FILE
);
const layout = require(`./${tableJsFile}`);

class TableLayout {
    // Switch the table layout file.  Requires reloading scripting.
    static SET_TABLE(value) {
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.TABLE, value);
    }
    static GET_TABLE() {
        return GlobalSavedData.get(
            GLOBAL_SAVED_DATA_KEY.TABLE,
            DEFAULT_TABLE_JS_FILE
        );
    }

    static desks() {
        return layout.desks;
    }

    static get anchor() {
        return layout.deskLayout.anchor;
    }

    static anchorPositionToWorld(anchor, pos) {
        assert(typeof anchor.pos.x === "number");
        assert(typeof anchor.pos.y === "number");
        assert(typeof anchor.pos.z === "number");
        assert(typeof anchor.yaw === "number");
        assert(typeof pos.x === "number");
        assert(typeof pos.y === "number");
        return new Vector(pos.x, pos.y, world.getTableHeight())
            .rotateAngleAxis(anchor.yaw, [0, 0, 1])
            .add(new Vector(anchor.pos.x, anchor.pos.y, anchor.pos.z));
    }

    static anchorRotationToWorld(anchor, rot) {
        assert(typeof anchor.yaw === "number");
        return new Rotator(0, anchor.yaw, 0).compose(rot);
    }
}

module.exports = { TableLayout };
