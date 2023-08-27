/**
 * System tiles need to be hex aligned for src/lib/unit/unit-plastic.js to
 * associate units with the system tile.  Tiles won't snap if they have objects
 * on them, or when there isn't a snap point.  Snap system tiles in onRelease.
 * (If they do snap, then onSnap is called instead.)
 */
const { Hex } = require("../lib/hex");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Rotator, globalEvents, world } = require("../wrapper/api");

const onSystemTileReleased = (
    obj,
    player,
    thrown,
    grabPosition,
    grabRotation
) => {
    let pos = obj.getPosition();
    let rot = obj.getRotation();

    // Align position.
    const hex = Hex.fromPosition(pos);
    pos = Hex.toPosition(hex);
    pos.z = world.getTableHeight();

    // Align rotation.
    const yaw = Math.round(rot.yaw / 60) * 60;
    rot = new Rotator(0, yaw, rot.roll);

    obj.setPosition(pos, 1);
    obj.setRotation(rot, 1);
};

globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isSystemTile(obj)) {
        obj.onReleased.add(onSystemTileReleased);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    const skipContained = false; // look inside containers
    for (const obj of world.getAllObjects(skipContained)) {
        if (ObjectNamespace.isSystemTile(obj)) {
            obj.onReleased.add(onSystemTileReleased);
        }
    }
}
