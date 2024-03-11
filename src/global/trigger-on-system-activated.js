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
        console.log(`onSystemActivated: unknown system "${nsid}"`);
        return;
    }

    const message = locale("ui.message.system_activated", {
        playerName: player.getName(),
        systemTile: system.tile,
        systemName: system.getSummaryStr(),
    });
    Broadcast.broadcastAll(message);
});

// Called when a player drops a command token.
const onCommandTokenReleased = (obj, player) => {
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
    if (!systemTile) {
        return;
    }
    const system = world.TI4.getSystemBySystemTileObject(systemTile);
    if (!system) {
        const nsid = ObjectNamespace.getNsid(systemTile);
        console.log(`onSystemActivated: unknown system "${nsid}"`);
        return;
    }
    globalEvents.TI4.onSystemActivated.trigger(systemTile, player);
};

function addListenerToCommandToken(obj) {
    //obj.onReleased.add(onCommandTokenReleased);

    // Enabling "always snap" in session options helps with some token stacking
    // issues, but apparenntly breaks onRelease (also does not call onSnapped,
    // onMovementStopped).
    obj.onGrab.add((obj, player) => {
        const tickHandler = () => {
            if (!obj.isHeld()) {
                obj.onTick.remove(tickHandler);
                onCommandTokenReleased(obj, player);
            }
        };
        obj.onTick.add(tickHandler);
    });
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isCommandToken(obj)) {
        addListenerToCommandToken(obj);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    const skipContained = false; // look inside containers!
    for (const obj of world.getAllObjects(skipContained)) {
        if (ObjectNamespace.isCommandToken(obj)) {
            addListenerToCommandToken(obj);
        }
    }
}
