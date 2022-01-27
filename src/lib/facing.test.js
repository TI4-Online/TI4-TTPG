const assert = require('assert')
const { Facing } = require('./facing')
const {
    Card,
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockRotator
} = require('../wrapper/api')

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

it('card (reverse)', () => {
    const normalCard = new MockCard({
        cardDetails : new MockCardDetails()
    })
    const flippedMetadataCard = new MockCard({
        cardDetails : new MockCardDetails({ flipped : true })
    })
    assert(normalCard instanceof Card)
    assert(!normalCard.getCardDetails().flipped)

    // The natural rotation for a card is showing the back on top.
    // Facing handles this, normal state is considered face down
    // unless template metadata marked it as flipped style.
    assert(Facing.isFaceDown(normalCard))
    assert(Facing.isFaceUp(flippedMetadataCard))
})