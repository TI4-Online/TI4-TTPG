const assert = require("../wrapper/assert-wrapper");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const { ColorUtil } = require("../lib/color/color-util");
const { globalEvents, refObject, world } = require("../wrapper/api");

const DESK_INDEX_KEY = "deskIndex";

function updateMyColor() {
    const myDeskIndex = ObjectSavedData.get(refObject, DESK_INDEX_KEY, -1);
    const playerDesk = world.TI4.getAllPlayerDesks()[myDeskIndex];
    if (playerDesk) {
        refObject.setSecondaryColor(playerDesk.color);
    }
}

globalEvents.TI4.onPlayerColorChanged.add((playerColor, deskIndex) => {
    assert(ColorUtil.isColor(playerColor));
    assert(typeof deskIndex === "number");

    // Always reset color when a player changes color (paranoia).
    updateMyColor();
});

refObject.onCreated.add((obj) => {
    updateMyColor();
});

if (world.getExecutionReason() === "ScriptReload") {
    updateMyColor();
}
