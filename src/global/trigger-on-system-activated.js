/**
 * Trigger:
 *
 *  globalEvents.TI4.onSystemActivated(object: system tile, player: Player)
 *
 * when the active player drops a command token on a system tile.
 */

const locale = require("../lib/locale");
const { globalEvents, world } = require("../wrapper/api");
const { Broadcast } = require("../lib/broadcast");
const { CommandToken } = require("../lib/command-token/command-token");
const { ObjectNamespace } = require("../lib/object-namespace");

const DEBUG_TOKEN_REGION = false;

// Register a listener to report (as well as test) system activation.
globalEvents.TI4.onSystemActivated.add((obj, player) => {
    const system = world.TI4.getSystemBySystemTileObject(obj);

    if (!system) {
        const nsid = ObjectNamespace.getNsid(obj);
        throw new Error(`onSystemActivated: unknown system "${nsid}"`);
    }

    const message = locale("ui.message.system_activated", {
        playerName: player.getName(),
        systemTile: system.tile,
        systemName: system.getSummaryStr(),
    });
    Broadcast.broadcastAll(message);
});

// Called when a player drops a command token.
const onCommandTokenReleased = (
    obj,
    player,
    thrown,
    grabPosition,
    grabRotation
) => {
    if (DEBUG_TOKEN_REGION) {
        CommandToken.debugHighlightTokens();
    }

    if (!world.TI4.turns.isActivePlayer(player)) {
        return; // not the active player
    }
    if (player.getSlot() !== obj.getOwningPlayerSlot()) {
        console.log(
            `player:${player.getSlot()} obj:${obj.getOwningPlayerSlot()}`
        );
        return; // token not owned by player
    }

    const pos = obj.getPosition();
    const systemTile = world.TI4.getSystemTileObjectByPosition(pos);
    if (systemTile) {
        globalEvents.TI4.onSystemActivated.trigger(systemTile, player);
    }
};

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
