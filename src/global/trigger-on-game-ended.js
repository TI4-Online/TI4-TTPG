/**
 * Trigger:
 *
 *  globalEvents.TI4.onGameEnded
 *
 * when moving a control token to the last spot
 */

const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Scoreboard } = require("../lib/scoreboard/scoreboard");
const { Spawn } = require("../setup/spawn/spawn");
const { Player, Vector, globalEvents, world } = require("../wrapper/api");

// Register a listener to report (as well as test) game end.
globalEvents.TI4.onGameEnded.add((playerSlot, clickingPlayer) => {
    console.log("onGameEnd");

    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const pos = playerDesk.localPositionToWorld(new Vector(20, 0, 20));
    const rot = playerDesk.rot;

    const trophyNsid = "misc:base/trophy";

    // Remove any existing trophies.
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === trophyNsid) {
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }

    // Spawn the tropy!
    const trophy = Spawn.spawn(trophyNsid, pos, rot);
    trophy.snapToGround();
});

function checkControlToken(obj, clickingPlayer) {
    assert(!clickingPlayer || clickingPlayer instanceof Player);
    assert(ObjectNamespace.isControlToken(obj));
    const scoreboard = Scoreboard.getScoreboard();
    const points = Scoreboard.getScoreFromToken(scoreboard, obj);
    const target = world.TI4.config.gamePoints;
    assert(typeof points === "number");
    assert(typeof target === "number");
    //console.log(`checkControlToken: ${points}`);
    if (points === target) {
        const playerSlot = obj.getOwningPlayerSlot();
        globalEvents.TI4.onGameEnded.trigger(playerSlot, clickingPlayer);
    }
}

const onControlTokenMovementStopped = (obj) => {
    checkControlToken(obj);
};

// Called when a player drops a command token.
const onControlTokenReleased = (
    obj,
    player,
    thrown,
    grabPosition,
    grabRotation
) => {
    checkControlToken(obj, player);
};

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isControlToken(obj)) {
        obj.onReleased.add(onControlTokenReleased);
        obj.onMovementStopped.add(onControlTokenMovementStopped);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isControlToken(obj)) {
            obj.onReleased.add(onControlTokenReleased);
            obj.onMovementStopped.add(onControlTokenMovementStopped);
        }
    }
}
