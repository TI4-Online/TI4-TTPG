const assert = require('assert')
const { MockGameObject } = require('../mock/mock-game-object')
const { Vector } = require('../mock/mock-vector')
const {
    isConsumable 
} = require('./r-swap-split-combine')

const OBJ = {
    fighter_x1 : new MockGameObject({ 
        templateMetadata : 'token:base/fighter_1',
    }),
    fighter_x1_faceDown : new MockGameObject({ 
        templateMetadata : 'token:base/fighter_1',
        rotation : new Vector(-180, 0, 0)
    }),
    not : new MockGameObject({ 
        templateMetadata : 'not:not/not',
    }),
}

it('isConsumable exactly one name', () => {
    const rule = {
        consume : { name : 'fighter_x1' }
    }
    assert(isConsumable(OBJ.fighter_x1, rule))
    assert(isConsumable(OBJ.fighter_x1_faceDown, rule))
    assert(!isConsumable(OBJ.not, rule))
})

it('isConsumable any name in list', () => {
    const rule = {
        consume : { names : [ 'foo', 'fighter_x1', 'bar' ] }
    }
    assert(isConsumable(OBJ.fighter_x1, rule))
    assert(isConsumable(OBJ.fighter_x1_faceDown, rule))
    assert(!isConsumable(OBJ.not, rule))
})

it('isConsumable any name in list', () => {
    const rule = {
        consume : { names : [ 'foo', 'fighter_x1', 'bar' ] }
    }
    assert(isConsumable(OBJ.fighter_x1, rule))
    assert(isConsumable(OBJ.fighter_x1_faceDown, rule))
    assert(!isConsumable(OBJ.not, rule))
})

it('isConsumable only face up', () => {
    const rule = {
        faceUp : true, consume : { name : 'fighter_x1' }
    }
    assert(isConsumable(OBJ.fighter_x1, rule))
    assert(!isConsumable(OBJ.fighter_x1_faceDown, rule))
})

it('isConsumable only face down', () => {
    const rule = {
        faceDown : true, consume : { name : 'fighter_x1' }
    }
    assert(isConsumable(OBJ.fighter_x1_faceDown, rule))
    assert(!isConsumable(OBJ.fighter_x1, rule))
})
