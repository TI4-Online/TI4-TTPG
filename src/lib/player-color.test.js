const assert = require('assert')
const { MockGameObject } = require('../mock/mock-game-object')
const { PlayerColor } = require('./player-color')

it('cannot construct', () => {
    assert.throws(() => { new PlayerColor() })
})

it.todo('fromColor')

it('to/fromObject', () => {
    const obj = new MockGameObject()
    assert(!PlayerColor.fromObject(obj))
    PlayerColor.setObjectColor(obj, 'white')
    assert.equal(PlayerColor.fromObject(obj), 'white')
})