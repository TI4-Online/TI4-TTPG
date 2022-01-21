const { TriggerableMulticastDelegate } = require('../lib/triggerable-multicast-delegate')
const { Vector } = require('./mock-vector')

class MockGameObject {
    constructor(data) {
        this._position = data && data.position || new Vector(0, 0, 0)
        this._rotation = data && data.rotation || new Vector(0, 0, 0)
        this._templateMetadata = data && data.templateMetadata || ''
    }

    onCreated = new TriggerableMulticastDelegate()
    onCustomAction = new TriggerableMulticastDelegate()
    onDestroyed = new TriggerableMulticastDelegate()
    onGrab = new TriggerableMulticastDelegate()
    onHit = new TriggerableMulticastDelegate()
    onMovementStopped = new TriggerableMulticastDelegate()
    onNumberAction = new TriggerableMulticastDelegate()
    onPrimaryAction = new TriggerableMulticastDelegate()
    onReleased = new TriggerableMulticastDelegate()
    onReset = new TriggerableMulticastDelegate()
    onSecondaryAction = new TriggerableMulticastDelegate()
    onSnapped = new TriggerableMulticastDelegate()
    onTick = new TriggerableMulticastDelegate()

    getPosition() {
        return this._position
    }

    getRotation() {
        return this._rotation
    }

    getTemplateMetadata() {
        return this._templateMetadata
    }
}

module.exports = {
    GameObject : MockGameObject,
    MockGameObject
}