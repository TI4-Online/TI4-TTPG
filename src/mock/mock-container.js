const TriggerableMulticastDelegate = require('../lib/triggerable-multicast-delegate')
const MockGameObject = require('./mock-game-object')

class MockContainer extends MockGameObject {
    onInserted = new TriggerableMulticastDelegate()
}

module.exports = MockContainer
