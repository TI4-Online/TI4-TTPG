const assert = require("../wrapper/assert-wrapper");
const { globalEvents, refPackageId, world } = require("../wrapper/api");

// Relative to assets/Sounds/
const SOUND_ASSET = "beep_ramp_up.wav";

let _sound = undefined;

function playTurnChangedSound() {
    // Load sound.
    if (!_sound) {
        _sound = world.importSound(SOUND_ASSET, refPackageId);
        assert(_sound);
    }

    // If still loading call again when load finishes.
    if (_sound.isLoaded()) {
        _sound.onLoadComplete.add((success) => {
            if (!success) {
                return; // error, give up
            }
            playTurnChangedSound();
        });
        return; // try again when load completes
    }

    // Sound exists and is loaded.
    if (_sound.isPlaying()) {
        _sound.stop();
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
