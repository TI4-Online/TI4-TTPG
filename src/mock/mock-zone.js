const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Zone {
    constructor() {}

    onBeginOverlap = new TriggerableMulticastDelegate();
    onEndOverlap = new TriggerableMulticastDelegate();

    destroy() {}

    getSavedData(value) {}

    setAlwaysVisible(value) {}
    setColor(value) {}
    setPosition(value) {}
    setRotation(value) {}
    setSavedData(value) {}
    setScale(value) {}
}

module.exports = Zone;
