// the "it(string, function)" style works with mocha and jest frameworks
const assert = require('assert')
const { systemSchemaValidator } = require('./schema')

it('validate good planet', () => {
    let jord = {
        tile: 1,
        home: true,
        planets: {
            name: 'Jord',
            resources: 4,
            influence: 2
        }
    }
    assert(systemSchemaValidator(jord))
})

it('validate system missing tile #', () => {
    let badJord = {
        home: true,
        planets: {
            name: 'Jord',
            resources: 4,
            influence: 2
        }
    }
    assert(!systemSchemaValidator(badJord))
})

it('validate system with malformed planet', () => {
    let badJord = {
        home: true,
        planets: {
            name: 'Jord',
            resources: "four",
            influence: 2
        }
    }
    assert(!systemSchemaValidator(badJord))
})

it('validate multiplanet system', () => {
    let maaluukDruaa = {
        tile: 9,
        home: true,
        planets: [
            {name: 'Maaluuk', resources: 0, influence: 2},
            {name: 'Druaa', resources: 3, influence: 1 }
        ]
    }
    assert(systemSchemaValidator(maaluukDruaa))
})

