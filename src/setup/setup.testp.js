const { Setup } = require("./setup");
const { SetupUnits } = require("./setup-units");
const {
    ObjectType,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("@tabletop-playground/api");
const { ObjectNamespace } = require("../lib/object-namespace");
const { SetupSupplyBoxes } = require("./setup-supply-boxes");

const ACTION = {
    PLAYER_DESKS: "*Player Desks",
    UNITS: "*Units",
    CLEAN_UNITS: "*Clean Units",
    SUPPLY: "*Supply",
    CLEAN_SUPPLY: "*Clean Supply",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.PLAYER_DESKS) {
        Setup.drawDebug();
    } else if (actionName === ACTION.UNITS) {
        for (const { pos, rot, playerSlot } of Setup.getPlayerDeskPosRots()) {
            SetupUnits.setup(pos, rot, playerSlot);
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
        for (const { pos, rot } of Setup.getPlayerDeskPosRots()) {
            SetupSupplyBoxes.setupLeft(pos, rot);
            SetupSupplyBoxes.setupRight(pos, rot);
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
    }
});
