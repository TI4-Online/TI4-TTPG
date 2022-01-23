// the "it(string, function)" style works with mocha and jest frameworks
const { ObjectNamespace } = require('./object-namespace')
const assert = require('assert')
const { MockGameObject } = require('../mock/mock-game-object')

it('cannot construct', () => {
    assert.throws(() => { new ObjectNamespace() })
})
  
it('generic', () => {
    const id = 'my.type:my.source/my.name'
    const obj = new MockGameObject({ templateMetadata : id })

    assert(ObjectNamespace.isGenericType(obj, 'my.type'))
    assert(!ObjectNamespace.isGenericType(obj, 'something.else'))
    
    const result = ObjectNamespace.parseGeneric(obj)
    assert.equal(result.type, 'my.type')
    assert.equal(result.source, 'my.source')
    assert.equal(result.name, 'my.name')
})

it('card', () => {
    const id = 'card.action:base/direct_hit.2'
    const obj = new MockGameObject({ templateMetadata : id })
    const not = new MockGameObject({ templateMetadata : 'not:not/not' })

    const type = ObjectNamespace.getCardType('action')
    assert(ObjectNamespace.isGenericType(obj, type))
    assert(!ObjectNamespace.isGenericType(not, type))
    
    const result = ObjectNamespace.parseCard(obj)
    assert.equal(result.type, 'card.action')
    assert.equal(result.source, 'base')
    assert.equal(result.name, 'direct_hit.2')
    assert.equal(result.deck, 'action')
})

it('command token', () => {
    const id = 'token.command:base/arborec'
    const obj = new MockGameObject({ templateMetadata : id })
    const not = new MockGameObject({ templateMetadata : 'not:not/not' })

    assert(ObjectNamespace.isCommandToken(obj))
    assert(!ObjectNamespace.isCommandToken(not))
    
    const result = ObjectNamespace.parseCommandToken(obj)
    assert.equal(result.type, 'token.command')
    assert.equal(result.source, 'base')
    assert.equal(result.name, 'arborec')
    assert.equal(result.faction, 'arborec')
})

it('control token', () => {
    const id = 'token.control:base/arborec'
    const obj = new MockGameObject({ templateMetadata : id })
    const not = new MockGameObject({ templateMetadata : 'not:not/not' })

    assert(ObjectNamespace.isControlToken(obj))
    assert(!ObjectNamespace.isControlToken(not))
    
    const result = ObjectNamespace.parseControlToken(obj)
    assert.equal(result.type, 'token.control')
    assert.equal(result.source, 'base')
    assert.equal(result.name, 'arborec')
    assert.equal(result.faction, 'arborec')
})

it('strategy card', () => {
    const id = 'tile.strategy:base/leadership.omega'
    const obj = new MockGameObject({ templateMetadata : id })
    const not = new MockGameObject({ templateMetadata : 'not:not/not' })

    assert(ObjectNamespace.isStrategyCard(obj))
    assert(!ObjectNamespace.isStrategyCard(not))
    
    const result = ObjectNamespace.parseStrategyCard(obj)
    assert.equal(result.type, 'tile.strategy')
    assert.equal(result.source, 'base')
    assert.equal(result.name, 'leadership.omega')
    assert.equal(result.card, 'leadership')
})

it('system tile', () => {
    const id = 'tile.system:base/18'
    const obj = new MockGameObject({ templateMetadata : id })
    const not = new MockGameObject({ templateMetadata : 'not:not/not' })

    assert(ObjectNamespace.isSystemTile(obj))
    assert(!ObjectNamespace.isSystemTile(not))
    
    const result = ObjectNamespace.parseSystemTile(obj)
    assert.equal(result.type, 'tile.system')
    assert.equal(result.source, 'base')
    assert.equal(result.name, '18')
    assert.equal(result.tile, 18)
})