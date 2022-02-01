const assert = require('../wrapper/assert')
const { Rotator, Vector } = require('../wrapper/api')

class Layout {
    constructor() {
        this._distanceBetween = 1
    }

    setDistanceBetween(value) {
        assert(typeof(value) === 'number')
        this._distanceBetween = value
        return this
    }

    setLayoutCenter(center) {
        assert(center instanceof Vector)
    }

    layoutArc() {

    }

    drawDebug() {

    }
}

module.exports = Layout