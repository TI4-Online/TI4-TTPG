const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../lib/saved-data/global-saved-data");

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
}

module.exports = { TableLayout };
