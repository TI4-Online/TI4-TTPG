const assert = require("../wrapper/assert-wrapper");
const { Hex } = require("../lib/hex");
const { ObjectNamespace } = require("../lib/object-namespace");
const {
    Color,
    Vector,
    ZoneShape,
    globalEvents,
    world,
} = require("../wrapper/api");

const ZONE_H = 2;
const ZONE_ALPHA = 0.2;
const SAVED_DATA = "__highlight_on_system_activated__";

let _activatedSystemZone = undefined;

function getZone(canAlloc) {
    if (_activatedSystemZone && _activatedSystemZone.isValid()) {
        return _activatedSystemZone;
    }
    for (const zone of world.getAllZones()) {
        if (zone.getSavedData() === SAVED_DATA) {
            _activatedSystemZone = zone;
            return _activatedSystemZone;
        }
    }
    if (!canAlloc) {
        return undefined;
    }
    _activatedSystemZone = world.createZone(
        new Vector(0, 0, world.getTableHeight())
    );
    _activatedSystemZone.setAlwaysVisible(true);
    _activatedSystemZone.setShape(ZoneShape.Hexagon);
    _activatedSystemZone.setScale(
        new Vector(Hex.HALF_SIZE * 2, Hex.HALF_SIZE * 2, ZONE_H)
    );
    _activatedSystemZone.setSavedData(SAVED_DATA);
    return _activatedSystemZone;
}

function applyHighlight(pos, color) {
    pos.z = world.getTableHeight() + ZONE_H / 2 - 0.1;
    const zone = getZone(true);
    zone.setPosition(pos);
    color = new Color(color.r, color.g, color.b, Math.max(0.1, ZONE_ALPHA));
    zone.setColor(color);
}

// Register a listener to report (as well as test) system activation.
globalEvents.TI4.onSystemActivated.add((obj, player) => {
    assert(ObjectNamespace.isSystemTile(obj));
    let pos = obj.getPosition();
    const hex = Hex.fromPosition(pos);
    pos = Hex.toPosition(hex);
    const currentDesk = world.TI4.turns.getCurrentTurn();
    const color = currentDesk ? currentDesk.color : new Color(1, 1, 0);
    applyHighlight(pos, color);
});

// Destroy any existing zone.
process.nextTick(() => {
    const zone = getZone(false);
    if (zone) {
        zone.destroy();
    }
});
