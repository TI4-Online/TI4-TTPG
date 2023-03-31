/**
 * Trying out "flick" behavior.
 *
 * Place this script on an object, when a player picks it up clone it at the
 * original location, and draw a flick vector based on the held object and
 * the original.
 *
 * When the player drops the object delete it, and "flick" the clone.
 */

const {
    DrawingLine,
    Vector,
    refObject,
    world,
} = require("@tabletop-playground/api");

let _clone = undefined;
let _arrow = undefined;

function onGrabHandler(object, player) {
    const json = object.toJSONString();
    const pos = object.getPosition();
    _clone = world.createObjectFromJSON(json, pos);
    object.onTick.add(onTickHandler);
}

function onReleasedHandler(object, player, thrown, grabPosition, grabRotation) {
    // Compute flick vector before destroying anything.
    const a = object.getPosition();
    const b = _clone.getPosition();
    const dir = b.subtract(a).multiply(50);
    dir.z = 0.1;

    // Destroy the origianl object and arrow.
    object.onTick.remove(onTickHandler);
    object.destroy();
    if (_arrow) {
        world.removeDrawingLineObject(_arrow);
        _arrow = undefined;
    }

    // Only flick if the release is not a throw.
    // Otherwise leave the clone sitting where the original was.
    if (thrown) {
        return;
    }

    // Flick!
    _clone.applyImpulse(dir);
}

function onTickHandler(object, deltaTime) {
    if (_arrow) {
        world.removeDrawingLineObject(_arrow);
        _arrow = undefined;
    }

    // Draw flick direction.
    const a = object.getPosition();
    const b = _clone.getPosition();
    const dir = b.subtract(a).multiply(2); // exaggerate
    dir.z = 0;
    const c = b.add(dir);
    _arrow = new DrawingLine();
    _arrow.points = [b, c];
    _arrow.normals = [new Vector(0, 0, 1)];
    _arrow.thickness = 1;
    world.addDrawingLine(_arrow);
}

refObject.onGrab.add(onGrabHandler);
refObject.onReleased.add(onReleasedHandler);
