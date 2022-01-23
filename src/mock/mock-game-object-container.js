const { TriggerableMulticastDelegate } = require('../lib/triggerable-multicast-delegate')
const { MockGameObject } = require('./mock-game-object')

class MockGameObjectContainer extends MockGameObject {
    onInserted = new TriggerableMulticastDelegate()
}

module.exports = {
    Container : MockGameObjectContainer,
    MockGameObjectContainer
}