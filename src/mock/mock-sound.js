const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Sound {
    constructor() {
        this.onLoadComplete = new TriggerableMulticastDelegate();
        this.onPlaybackFinished = new TriggerableMulticastDelegate();
    }
    destroy() {}
    getDuration() {}
    getPlaybackFraction() {}
    getPlaybackTime() {}
    isLoaded() {}
    isPlaying() {}
    play() {}
    playAtLocation() {}
    playAttached() {}
    stop() {}
    stopLoop() {}
}

module.exports = Sound;
