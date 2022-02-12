const { isArray } = require("../wrapper/lodash-wrapper")
const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate")
const MockGameObject = require("./mock-game-object")

class MockContainer extends MockGameObject {
    _objects = []

    onInserted = new TriggerableMulticastDelegate()

    addObjects(objectsArray) {
        if(isArray(objectsArray)) {
            this._objects = [
                ...this._objects,
                ...objectsArray,
            ]
        }
    }

    getItems() {
        return this._objects
    }
}

module.exports = MockContainer
