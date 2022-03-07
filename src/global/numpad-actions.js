/**
 * Numpad key actions
 */
const assert = require("../wrapper/assert-wrapper");
const { Spawn } = require("../setup/spawn/spawn");
const { Player, Rotator, globalEvents } = require("../wrapper/api");

globalEvents.onScriptButtonPressed.add((player, index) => {
    assert(player instanceof Player);

    //console.log(`onScriptButtonPressed: ${index}`);

    if (index == 1) {
        // Spawn TG.
        const nsid = "token:base/tradegood_commodity_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    } else if (index == 2) {
        // Spawn Fighter.
        const nsid = "token:base/fighter_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    } else if (index == 3) {
        // Spawn Infantry.
        const nsid = "token:base/infantry_1";
        const pos = player.getCursorPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);
        Spawn.spawn(nsid, pos, rot);
    } else if (index == 10) {
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
