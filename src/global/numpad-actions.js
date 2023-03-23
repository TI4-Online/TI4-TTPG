/**
 * Numpad key actions
 */
const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { Spawn } = require("../setup/spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const {
    Player,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

// Numpad-0 "graveyards" held objects.  Require players enable it.
const _numpadZeroAccess = {};

function lookAt(pos, yaw, distance, player) {
    assert(typeof pos.x === "number");
    assert(typeof yaw === "number");
    assert(typeof distance === "number");
    assert(player instanceof Player);
    const lookAt = new Vector(pos.x, pos.y, world.getTableHeight());
    const lookFrom = new Vector(-10, 0, world.getTableHeight() + distance)
        .rotateAngleAxis(yaw, [0, 0, 1])
        .add(lookAt);
    const rot = lookFrom.findLookAtRotation(lookAt);
    player.setPositionAndRotation(lookFrom, rot);
}

globalEvents.onScriptButtonPressed.add((player, index, ctrl, alt) => {
    assert(player instanceof Player);
    assert(typeof index === "number");

    //console.log(`onScriptButtonPressed: ${index} ctrl=${ctrl} alt=${alt}`);

    // Ctrl-# looks at a player desk.
    if (ctrl && !alt && index < 10) {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const playerDesk = playerDesks[index - 1];
        if (playerDesk) {
            const pos = playerDesk.center;
            const yaw = playerDesk.rot.yaw;
            lookAt(pos, yaw, 70, player);
        }
        return;
    }

    // Ctrl-Alt-# looks at a player desk at an angle (strategy, agenda popup view).
    if (ctrl && alt && index < 10) {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const playerDesk = playerDesks[index - 1];
        if (playerDesk) {
            const lookAt = playerDesk.localPositionToWorld({
                x: 10,
                y: 0,
                z: 25,
            });
            const lookFrom = playerDesk.localPositionToWorld({
                x: -40,
                y: 0,
                z: 70,
            });
            const rot = lookFrom.findLookAtRotation(lookAt);
            player.setPositionAndRotation(lookFrom, rot);
        }
        return;
    }

    // [1-3] Spawn tokens.
    if (index === 1) {
        // Spawn TG.
        const nsid = "token:base/tradegood_commodity_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    } else if (index === 2) {
        // Spawn Fighter.
        const nsid = "token:base/fighter_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    } else if (index === 3) {
        // Spawn Infantry.
        const nsid = "token:base/infantry_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    }

    // [4-9] Move camera: 4=UI, 5=active system, 6=map, 7=scoreboard, 8=(votes), 9=player zone.
    if (index === 4) {
        const anchor = TableLayout.anchor.gameUI;
        lookAt(anchor.pos, anchor.yaw, 70, player);
    } else if (index === 5) {
        const systemTileObj = world.TI4.getActiveSystemTileObject();
        if (systemTileObj) {
            const pos = systemTileObj.getPosition();
            const yaw = systemTileObj.getRotation().yaw;
            lookAt(pos, yaw, 20, player);
        }
    } else if (index === 6) {
        // This view is tight on map for my screen, but varies on other screens.
        // Feature request out to TTPG to "view rect", currently not possible?
        const pos = new Vector(0, 0, 0);
        const yaw = 0;
        lookAt(pos, yaw, 110, player);
    } else if (index === 7) {
        const anchor = TableLayout.anchor.score;
        lookAt(anchor.pos, anchor.yaw, 50, player);
    } else if (index === 9) {
        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            const pos = playerDesk.center;
            const yaw = playerDesk.rot.yaw;
            lookAt(pos, yaw, 70, player);
        }
    }

    if (index === 10) {
        const key = player.getName();
        let value = _numpadZeroAccess[key] || 0;
        const needed = 3;
        if (value < needed) {
            if (ctrl) {
                // Player may press control-numpad0 several times to access
                value += 1;
                _numpadZeroAccess[key] = value;
                if (value < needed) {
                    Broadcast.chatOne(
                        player,
                        locale("ui.error.numpad0_progress", {
                            remaining: needed - value,
                        }),
                        Broadcast.ERROR
                    );
                } else {
                    Broadcast.chatOne(
                        player,
                        locale("ui.error.numpad0_granted"),
                        Broadcast.ERROR
                    );
                }
            } else {
                Broadcast.chatOne(
                    player,
                    locale("ui.error.numpad0_control", {
                        remaining: needed - value,
                    }),
                    Broadcast.ERROR
                );
            }
            return;
        }

        // Graveyard held objects.
        const container = undefined;
        const rejectedObjs = player.getHeldObjects();
        if (rejectedObjs.length > 0) {
            globalEvents.TI4.onContainerRejected.trigger(
                container,
                rejectedObjs,
                player
            );
        }
    }
});
