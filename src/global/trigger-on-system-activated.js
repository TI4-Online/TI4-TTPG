/**
 * Trigger:
 *
 *  globalEvents.TI4.onSystemActivated(object: system tile, player: Player)
 *
 * when the active player drops a command token on a system tile.
 */

const { globalEvents, world, Vector } = require("@tabletop-playground/api");
const { Broadcast } = require("../lib/broadcast");
const { ObjectNamespace } = require("../lib/object-namespace");
const { System } = require("../lib/system/system");
const { Turns } = require("../lib/turns");
const locale = require("../lib/locale");

// Register a listener to report (as well as test) system activation.
globalEvents.TI4.onSystemActivated.add((obj, player) => {
    const system = System.getBySystemTileObject(obj);
    const message = locale("ui.message.system_activated", {
        playerName: player.getName(),
        systemTile: system.tile,
        systemName: system.getSummaryStr(),
    });
    Broadcast.broadcastAll(message);
});

// Called when a player drops a command token.
function onCommandTokenReleased(
    obj,
    player,
    thrown,
    grabPosition,
    grabRotation
) {
    if (!Turns.isActivePlayer(player)) {
        return; // not the active player
    }
    if (player.getSlot() !== obj.getOwningPlayerSlot()) {
        console.log(
            `player:${player.getSlot()} obj:${obj.getOwningPlayerSlot()}`
        );
        return; // token not owned by player
    }

    const src = obj.getPosition();
    const dst = new Vector(src.x, src.y, world.getTableHeight() - 5);
    const hits = world.lineTrace(src, dst);
    for (const hit of hits) {
        if (ObjectNamespace.isSystemTile(hit.object)) {
            globalEvents.TI4.onSystemActivated.trigger(hit.object, player);
            break;
        }
    }
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isCommandToken(obj)) {
        obj.onReleased.add(onCommandTokenReleased);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isCommandToken(obj)) {
            obj.onReleased.add(onCommandTokenReleased);
        }
    }
}
