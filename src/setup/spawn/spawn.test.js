const assert = require('assert')
const locale = require('../../lib/locale')
const { Spawn } = require('./spawn')

it('static getAllNSIDs', () => {
    const nsids = Spawn.getAllNSIDs()
    assert(nsids.length > 0)
})

it('static getGroupName', () => {
    const groupName = Spawn.getGroupName('card.technology.blue.creuss:base/...')
    assert.equal(groupName, 'card.technology')
})

it('static groupNSIDs', () => {
    const nsids = Spawn.getAllNSIDs()
    const typeToNsids = Spawn.groupNSIDs(nsids)
    assert(Object.keys(typeToNsids).length > 0)
})

it('static suggestName deck', () => {
    let name = Spawn.suggestName('card.action:base/whatever')
    assert.equal(name, locale('deck.action'))
    assert(name !== 'deck.action') // locale has the translation
})