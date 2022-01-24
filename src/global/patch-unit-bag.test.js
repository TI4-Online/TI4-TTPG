const { 
    REJECT_REASON,
    getRejectReason
} = require('./patch-unit-bag')
const { MockGameObject } = require('../mock/mock-game-object')
const assert = require('assert')

it('can accept unit', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), false)
})

it('not a unit bag', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.token:base/fighter_1',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.BAG_NOT_UNIT)
})

it('malformed bag', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:garbage',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.BAG_PARSE)
})

it('anonymous bag', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : -1
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.BAG_NO_OWNER)
})

it('not a unit', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'token:base/fighter_1',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.UNIT_NOT_UNIT)
})

it('malformed unit', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:garbage',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.UNIT_PARSE)
})

it('mismatch unit', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/infantry',
        owningPlayerSlot : 7
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.MISMATCH_UNIT)
})

it('mismatch owner', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 8
    })
    assert.equal(getRejectReason(bag, unit), REJECT_REASON.MISMATCH_OWNER)
})

it('set anonymous unit owner', () => {
    const bag = new MockGameObject({
        templateMetadata : 'bag.unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unit = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : -1
    })
    assert.equal(unit.getOwningPlayerSlot(), -1)
    assert.equal(getRejectReason(bag, unit), false)
    assert.equal(unit.getOwningPlayerSlot(), 7)
})