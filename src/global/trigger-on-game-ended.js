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
const {
    GameObject,
    Player,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

const _playerSlotToScore = {};
const SPAWN_TROPHY = false;
let _spawnedTrophy = false;

function spawnTrophy(playerSlot) {
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
}

// Register a listener to report (as well as test) game end.
globalEvents.TI4.onGameEnded.add((playerSlot, clickingPlayer) => {
    console.log("onGameEnd");

    if (SPAWN_TROPHY && !_spawnedTrophy) {
        _spawnedTrophy = true;
        spawnTrophy(playerSlot);
    }
});

function checkControlToken(obj, clickingPlayer) {
    assert(ObjectNamespace.isControlToken(obj));
    assert(!clickingPlayer || clickingPlayer instanceof Player);

    const scoreboard = Scoreboard.getScoreboard();
    const points = Scoreboard.getScoreFromToken(scoreboard, obj);
    const target = world.TI4.config.gamePoints;
    const playerSlot = obj.getOwningPlayerSlot();
    assert(typeof points === "number");
    assert(typeof target === "number");
    if (_playerSlotToScore[playerSlot] === points) {
        return; // already processed this point value
    }
    _playerSlotToScore[playerSlot] = points;
    //console.log(`checkControlToken: ${points}`);
    if (points === target) {
        globalEvents.TI4.onGameEnded.trigger(playerSlot, clickingPlayer);
    }
}

/**
 * Add onMovementStopped handler that suppresses the event when not moved much.
 * (Physics can call it constantly).
 *
 * @param {GameObject} obj
 */
function addSuppressedOnControlTokenMovementStopped(obj) {
    assert(obj instanceof GameObject);
    assert(ObjectNamespace.isControlToken(obj));

    // Wrap this state / history with the handler.
    let lastPosition = obj.getPosition();

    obj.onMovementStopped.add(() => {
        if (!obj.isValid()) {
            return; // deleted
        }
        const newPosition = obj.getPosition();
        const dSq = lastPosition.subtract(newPosition).magnitudeSquared();
        if (dSq < 0.5) {
            return; // did not move enough to keep working
        }

        // Okay actually moved, check score.
        checkControlToken(obj);
    });
}

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
        addSuppressedOnControlTokenMovementStopped(obj);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    const skipContained = false; // look inside containers
    for (const obj of world.getAllObjects(skipContained)) {
        if (ObjectNamespace.isControlToken(obj)) {
            obj.onReleased.add(onControlTokenReleased);
            addSuppressedOnControlTokenMovementStopped(obj);
        }
    }
}
