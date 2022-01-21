const { TriggerableMulticastDelegate } = require('../lib/triggerable-multicast-delegate')

class MockGameObject {
    constructor(data) {
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

    getTemplateMetadata() {
        return this._templateMetadata
    }

}

module.exports = {
    MockGameObject
}