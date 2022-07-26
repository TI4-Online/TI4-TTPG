const assert = require("../wrapper/assert-wrapper");
const {
    PlayerPermission,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");

// Relative to assets/Sounds/
const SOUND_ASSET = "beep_ramp_up.wav";

function playTurnChangedSound(playerSlot) {
    assert(typeof playerSlot === "number");

    const sound = world.importSound(SOUND_ASSET, refPackageId);
    if (!sound) {
        return;
    }

    const playerPermission = new PlayerPermission();
    playerPermission.setPlayerSlots([playerSlot]);

    const startTime = 0;
    const volume = 0.5; // [0:2] range
    const loop = false;
    sound.play(startTime, volume, loop, playerPermission);
}

globalEvents.TI4.onTurnChanged.add(
    (currentDesk, previousDesk, clickingPlayer) => {
        playTurnChangedSound(currentDesk.playerSlot);
    }
);
