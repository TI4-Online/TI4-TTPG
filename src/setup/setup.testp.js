const { Setup } = require("./setup");
const { SetupSheets } = require("./setup-sheets");
const { SetupSupplyBoxes } = require("./setup-supply-boxes");
const { SetupSystemTiles } = require("./setup-system-tiles");
const { SetupUnits } = require("./setup-units");
const { MapStringLoad } = require("../lib/map-string/map-string-load");
const { refObject, world } = require("@tabletop-playground/api");

const ACTION = {
    GIZMO_DESKS: "*Gizmo desks",
    COUNT_OBJECTS: "*Count objects",
    CLEAN: "*Clean",
    UNITS: "*Units",
    SUPPLY: "*Supply",
    SHEETS: "*Sheets",
    SYSTEM_TILES: "*System tiles",
    DEMO_MAP: "*Demo map",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.GIZMO_DESKS) {
        Setup.drawDebug();
    } else if (actionName === ACTION.COUNT_OBJECTS) {
        console.log(`World #objects = ${world.getAllObjects().length}`);
    } else if (actionName === ACTION.CLEAN) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer() || obj == refObject) {
                continue;
            }
            obj.destroy();
        }
    } else if (actionName === ACTION.UNITS) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupUnits.setupDesk(deskData);
        }
    } else if (actionName === ACTION.SUPPLY) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupSupplyBoxes.setupDesk(deskData);
        }
    } else if (actionName === ACTION.SHEETS) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupSheets.setupDesk(deskData);
        }
    } else if (actionName === ACTION.SYSTEM_TILES) {
        SetupSystemTiles.setup();
    } else if (actionName === ACTION.DEMO_MAP) {
        MapStringLoad.load(
            "70 32 50 47 42 73 74 65 48 69 71 64 78 36 26 66 77 72 1 46 79 2 27 45 3 24 29 4 62 37 5 41 38 6 43 40"
        );
    }
});
