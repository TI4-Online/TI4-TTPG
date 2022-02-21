const { refObject, world, GameObject } = require("../../wrapper/api");
const { Facing } = require("../../lib/facing");
const assert = require("../../wrapper/assert-wrapper");

let _ionStormTileNumber = 0;
let _placedAlphaUp = true;

function removeIonStorm() {
    if (_ionStormTileNumber) {
        const prevSystem = world.TI4.getSystemByTileNumber(_ionStormTileNumber);

        if (_placedAlphaUp) {
            const index = prevSystem.wormholes.indexOf("alpha");
            prevSystem.wormholes.splice(index, 1);
        } else {
            const index = prevSystem.wormholes.indexOf("beta");
            prevSystem.wormholes.splice(index, 1);
        }

        _ionStormTileNumber = 0;
    }
}

function placeIonStorm(obj) {
    assert(obj instanceof GameObject);
    const pos = obj.getPosition();
    const systemObject = world.TI4.getSystemTileObjectByPosition(pos);
    if (systemObject) {
        removeIonStorm();

        const system = world.TI4.getSystemBySystemTileObject(systemObject);

        if (!system.wormholes) {
            system.wormholes = [];
        }

        if (Facing.isFaceUp(obj)) {
            _placedAlphaUp = true;
            system.wormholes.push("alpha");
        } else {
            _placedAlphaUp = false;
            system.wormholes.push("beta");
        }

        _ionStormTileNumber = system.tile;
    }
}

refObject.onReleased.add(placeIonStorm);
refObject.onGrab.add(removeIonStorm);
refObject.onCreated.add(placeIonStorm);

// pressing f to flip does not trigger onReleased or onGrab
refObject.onMovementStopped.add(placeIonStorm);

if (world.getExecutionReason() === "ScriptReload") {
    placeIonStorm(refObject);
}
