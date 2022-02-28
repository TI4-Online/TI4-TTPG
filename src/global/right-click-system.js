const { Explore } = require("../lib/explore/explore");
const { globalEvents, world } = require("../wrapper/api");

function addRightClickOptions(systemTileObj) {
    Explore.addCustomActions(systemTileObj);
}

globalEvents.onObjectCreated.add((obj) => {
    if (world.TI4.getSystemBySystemTileObject(obj)) {
        addRightClickOptions(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.TI4.getAllSystemTileObjects()) {
        addRightClickOptions(obj);
    }
}
