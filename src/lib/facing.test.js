const assert = require('assert')
const { MockGameObject, MockRotator } = require('../wrapper/api')
const { Facing } = require('./facing')

const FACING_UP = new MockGameObject({
    rotation : new MockRotator(0, 0, 0)
})

const FACING_DOWN = new MockGameObject({
    rotation : new MockRotator(0, 0, -180)
})

it('up', () => {
    assert(Facing.isFaceUp(FACING_UP))
    assert(!Facing.isFaceUp(FACING_DOWN))
})

it('down', () => {
    assert(Facing.isFaceDown(FACING_DOWN))
    assert(!Facing.isFaceDown(FACING_UP))
})