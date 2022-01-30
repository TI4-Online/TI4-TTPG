const assert = require('../../wrapper/assert')
const { AuxData } = require('./auxdata')
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockVector,
    world
} = require('../../wrapper/api')

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
    world.__addObject(new MockGameObject({
        templateMetadata : 'unit:base/dreadnought',
        owningPlayerSlot : selfPlayerSlot
    }))

    // Carrier 2
    world.__addObject(new MockCard({
        cardDetails : new MockCardDetails({
            metadata : 'card.technology.unit_upgrade:base/carrier_2'
        }),
        owningPlayerSlot : selfPlayerSlot
    }))
    
    // Morale boost!
    world.__addObject(new MockCard({
        cardDetails : new MockCardDetails({
            metadata : 'card.action:base/morale_boost.3'
        }),
        owningPlayerSlot : selfPlayerSlot
    }))

    let aux1, aux2
    try {
        [ aux1, aux2 ] = AuxData.createForPair(selfPlayerSlot, opponentPlayerSlot, '<0,0,0>', new Set())
    } finally {
        for (const gameObject of world.getAllObjects()) {
            world.__removeObject(gameObject)
        }
    }

    // Basic finding.
    assert.equal(aux1.count('fighter'), 4)
    assert.equal(aux1.unitAttrsSet.get('carrier').raw.localeName, 'unit.carrier_2')
    assert.equal(aux1.unitModifiers.length, 1)
    assert.equal(aux1.unitModifiers[0].raw.localeName, 'unit_modifier.name.morale_boost')

    assert.equal(aux2.count('fighter'), 1)

    // Verify self modifier.
    assert.equal(aux1.count('fighter'), 4)

    // Verify opponent's opponent modifier.
})

it('constructor', () => {
    new AuxData()
})

