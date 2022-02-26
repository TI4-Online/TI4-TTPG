const assert = require("../wrapper/assert-wrapper");
const { Color, globalEvents, refObject } = require("../wrapper/api");

globalEvents.TI4.onPlayerColorChanged.add((playerColor, deskIndex) => {
    assert(playerColor instanceof Color);
    assert(typeof deskIndex === "number");

    let json = refObject.getSavedData();
    if (json.length == 0) {
        return;
    }
    json = JSON.parse(json);
    if (json.deskIndex === deskIndex) {
        refObject.setPrimaryColor(playerColor);
    }
});
