const assert = require('assert')
const { MockGameObject } = require('../mock/mock-game-object')
const { Vector } = require('../mock/mock-vector')
const { Facing } = require('./facing')

const FACING_UP = new MockGameObject({
    rotation : new Vector(0, 0, 0)
})

const FACING_DOWN = new MockGameObject({
    rotation : new Vector(-180, 0, 0)
})

it('up', () => {
    assert(Facing.up(FACING_UP))
    assert(!Facing.up(FACING_DOWN))
})

it('down', () => {
    assert(Facing.down(FACING_DOWN))
    assert(!Facing.down(FACING_UP))
})