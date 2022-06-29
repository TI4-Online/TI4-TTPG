const assert = require("../wrapper/assert-wrapper");
const {
    PlayerPermission,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");

// Relative to assets/Sounds/
const SOUND_ASSET = "beep_ramp_up.wav";

let _sound = undefined;

function playTurnChangedSound(playerSlot) {
    assert(typeof playerSlot === "number");

    if (!_sound) {
        _sound = world.importSound(SOUND_ASSET, refPackageId);
        assert(_sound);
    }

    const playerPermission = new PlayerPermission();
    playerPermission.setPlayerSlots([playerSlot]);

    const startTime = 0;
    const volume = 0.5; // [0:2] range
    const loop = false;
    _sound.play(startTime, volume, loop, playerPermission);
}

globalEvents.TI4.onTurnChanged.add(
    (currentDesk, previousDesk, clickingPlayer) => {
        playTurnChangedSound(currentDesk.playerSlot);
    }
);
