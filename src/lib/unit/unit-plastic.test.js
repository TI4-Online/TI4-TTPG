const assert = require('assert')
const { UnitPlastic, _getUnitPlastic } = require('./unit-plastic')
const { world, MockGameObject } = require('../../wrapper/api')

it('static getAll', () => {
    const fighter = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    const fighter_x3 = new MockGameObject({
        templateMetadata : 'token:base/fighter_3'
    })
    world.__addObject(fighter)
    world.__addObject(fighter_x3)
    try {
        const result = UnitPlastic.getAll()
        assert.equal(result.length, 2)
        assert.equal(result[0].gameObject, fighter)
        assert.equal(result[0].unit, 'fighter')
        assert.equal(result[0].count, 1)
        assert.equal(result[1].gameObject, fighter_x3)
        assert.equal(result[1].unit, 'fighter')
        assert.equal(result[1].count, 3)
    } finally {
        world.__removeObject(fighter)
        world.__removeObject(fighter_x3)
    }
})

it('static assignTokens', () => {
    const fighter = _getUnitPlastic(new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    }))
    const fighter_x3 = _getUnitPlastic(new MockGameObject({
        templateMetadata : 'token:base/fighter_3'
    }))
    assert.equal(fighter.owningPlayerSlot, 7)
    assert.equal(fighter_x3.owningPlayerSlot, -1)

    UnitPlastic.assignTokens([ fighter, fighter_x3 ])
    assert.equal(fighter.owningPlayerSlot, 7)
    assert.equal(fighter_x3.owningPlayerSlot, 7)
})

it('constructor + getters', () => {
    const gameObject = new MockGameObject({
        templateMetadata : 'unit:base/fighter',
        owningPlayerSlot : 7
    })
    const unitPlastic = new UnitPlastic('fighter', 1, gameObject)
    assert.equal(unitPlastic.unit, 'fighter')
    assert.equal(unitPlastic.count, 1)
    assert.equal(unitPlastic.gameObject, gameObject)
    assert.equal(unitPlastic.hex, '<0,0,0>')
    assert.equal(unitPlastic.owningPlayerSlot, 7)
    assert(!unitPlastic.planet)
})