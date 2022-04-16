const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Zone {
    constructor(data) {
        this._overlappingObjects = (data && data.overlappingObjects) || [];
    }

    onBeginOverlap = new TriggerableMulticastDelegate();
    onEndOverlap = new TriggerableMulticastDelegate();

    destroy() {}

    getOverlappingObjects() {
        return this._overlappingObjects;
    }
    getSavedData(value) {}

    setAlwaysVisible(value) {}
    setColor(value) {}
    setPosition(value) {}
    setRotation(value) {}
    setSavedData(value) {}
    setScale(value) {}
    setShape(value) {}
    setSlotOwns(slot, isOwner) {}
    setStacking(value) {}
}

module.exports = Zone;
