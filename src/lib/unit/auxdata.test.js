const assert = require('../../wrapper/assert')
const { AuxData } = require('./auxdata')
const { world, MockGameObject, MockVector } = require('../../wrapper/api')

it('static createForPair', () => {
    const selfPlayerSlot = 7
    const opponentPlayerSlot = 8

    // Place a few units and tokens.
    world.__addObject(new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : selfPlayerSlot
    }))
    world.__addObject(new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : opponentPlayerSlot,
        position : new MockVector(0.5, 0, 0) // further from tokens than above
    }))
    world.__addObject(new MockGameObject({
        templateMetadata : 'token:base/fighter_3'
    }))
    world.__addObject(new MockGameObject({
        templateMetadata : 'token:base/infantry_1'
    }))

    let aux1, aux2
    try {
        [ aux1, aux2 ] = AuxData.createForPair(selfPlayerSlot, opponentPlayerSlot, '<0,0,0>', new Set())
    } finally {
        for (const gameObject of world.getAllObjects()) {
            world.__removeObject(gameObject)
        }
    }

    assert.equal(aux1.count('fighter'), 4)
    assert.equal(aux2.count('fighter'), 1)
})

it('constructor', () => {
    new AuxData()
})

