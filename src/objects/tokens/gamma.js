const { refObject, world, GameObject } = require("../../wrapper/api");
const assert = require("../../wrapper/assert-wrapper");

let _gammaTileNumber = 0;

function removeGamma() {
    if (_gammaTileNumber) {
        const prevSystem = world.TI4.getSystemByTileNumber(_gammaTileNumber);

        const index = prevSystem.wormholes.indexOf("gamma");
        prevSystem.wormholes.splice(index, 1);

        _gammaTileNumber = 0;
    }
}

function placeGamma(obj) {
    assert(obj instanceof GameObject);
    const pos = obj.getPosition();
    const systemObject = world.TI4.getSystemTileObjectByPosition(pos);
    if (systemObject) {
        removeGamma();

        const system = world.TI4.getSystemBySystemTileObject(systemObject);

        if (!system.wormholes) {
            system.wormholes = [];
        }
        system.wormholes.push("gamma");

        _gammaTileNumber = system.tile;
    }
}

refObject.onReleased.add(placeGamma);
refObject.onGrab.add(removeGamma);
refObject.onCreated.add(placeGamma);

if (world.getExecutionReason() === "ScriptReload") {
    placeGamma(refObject);
}
