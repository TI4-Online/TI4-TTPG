const assert = require("../wrapper/assert-wrapper");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const { ColorUtil } = require("../lib/color/color-util");
const { globalEvents, refObject, world } = require("../wrapper/api");

const DESK_INDEX_KEY = "deskIndex";

globalEvents.TI4.onPlayerColorChanged.add((playerColor, deskIndex) => {
    assert(ColorUtil.isColor(playerColor));
    assert(typeof deskIndex === "number");

    // Always reset color when a player changes color (paranoia).
    const myDeskIndex = ObjectSavedData.get(refObject, DESK_INDEX_KEY, -1);
    const playerDesk = world.TI4.getAllPlayerDesks()[myDeskIndex];
    if (playerDesk) {
        refObject.setPrimaryColor(playerDesk.color);
    }
});

refObject.onCreated.add((obj) => {
    const myDeskIndex = ObjectSavedData.get(obj, DESK_INDEX_KEY, -1);
    const playerDesk = world.TI4.getAllPlayerDesks()[myDeskIndex];
    if (playerDesk) {
        obj.setPrimaryColor(playerDesk.color);
    }
});
