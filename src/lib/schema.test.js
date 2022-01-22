// the "it(string, function)" style works with mocha and jest frameworks
const assert = require('assert')
const { unitSchemaValidator, systemSchemaValidator } = require('./schema')

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

it('validate good unit', () => {
    let carrier = {
        name: "Carrier",
        cost: 3,
        spaceCombat: {dice: 1, hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    assert(unitSchemaValidator(carrier))
})

it('validate complex unit', () => {
    let helTitan = {
        name: "Hel Titan I",
        planetaryShield: true,
        spaceCannon: {dice: 1, hit: 6},
        sustainDamage: true,
        production: 1,
        structure: true,
        groundCombat: {dice: 1, hit: 7}
    }
    assert(unitSchemaValidator(helTitan))
})

it('validate unit without name', () => {
    let badCarrier = {
        cost: 3,
        spaceCombat: {dice: 1, hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    assert(!unitSchemaValidator(badCarrier))
})

it('validate unit with no dice given for spaceCombat', () => {
    let carrier = {
        name: "Carrier",
        spaceCombat: {hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    let valid = unitSchemaValidator(carrier)
    assert(valid)
    assert.equal(carrier.spaceCombat.dice, 1)
})

