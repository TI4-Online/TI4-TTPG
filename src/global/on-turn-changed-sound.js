const assert = require("../wrapper/assert-wrapper");
const { globalEvents, refPackageId, world } = require("../wrapper/api");

// Relative to assets/Sounds/
const SOUND_ASSET = "beep_ramp_up.wav";

let _sound = undefined;

function playTurnChangedSound() {
    console.log("playTurnChangedSound");

    if (!_sound) {
        _sound = world.importSound(SOUND_ASSET, refPackageId);
        assert(_sound);
    }

    const startTime = 0;
    const volume = 1; // [0:2] range
    const loop = false;
    _sound.play(startTime, volume, loop);
}

globalEvents.TI4.onTurnChanged.add(
    (currentDesk, previousDesk, clickingPlayer) => {
        playTurnChangedSound();
    }
);
