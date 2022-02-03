const { Setup } = require("./setup");
const { SetupUnits } = require("./setup-units");
const { refObject, world } = require("@tabletop-playground/api");
const { ObjectNamespace } = require("../lib/object-namespace");
const { SetupSupplyBoxes } = require("./setup-supply-boxes");
const { SetupSheets } = require("./setup-sheets");

const ACTION = {
    PLAYER_DESKS: "*Player Desks",
    UNITS: "*Units",
    CLEAN_UNITS: "*Clean Units",
    SUPPLY: "*Supply",
    CLEAN_SUPPLY: "*Clean Supply",
    SHEETS: "*Sheets",
    CLEAN_SHEETS: "*Clean Sheets",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.PLAYER_DESKS) {
        Setup.drawDebug();
    } else if (actionName === ACTION.UNITS) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupUnits.setup(deskData);
        }
    } else if (actionName === ACTION.CLEAN_UNITS) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("bag.unit")) {
                obj.destroy();
            }
            if (nsid.startsWith("unit")) {
                obj.destroy();
            }
        }
    } else if (actionName === ACTION.SUPPLY) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupSupplyBoxes.setup(deskData);
        }
    } else if (actionName === ACTION.CLEAN_SUPPLY) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("bag.token")) {
                obj.destroy();
            }
        }
    } else if (actionName === ACTION.SHEETS) {
        for (const deskData of Setup.getPlayerDeskPosRots()) {
            SetupSheets.setup(deskData);
        }
    } else if (actionName === ACTION.CLEAN_SHEETS) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("sheet:")) {
                obj.destroy();
            }
        }
    }
});
