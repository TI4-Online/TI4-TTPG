const assert = require('assert')
const { UnitAttrsSchema } = require('./unit-attrs-schema')

it('validate good unit', () => {
    let carrier = {
        localeName: "unit.carrier",
        cost: 3,
        spaceCombat: {dice: 1, hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    assert(UnitAttrsSchema.validate(carrier))
})

it('validate complex unit', () => {
    let helTitan = {
        localeName: "unit.hel_titan_1",
        planetaryShield: true,
        spaceCannon: {dice: 1, hit: 6},
        sustainDamage: true,
        production: 1,
        structure: true,
        groundCombat: {dice: 1, hit: 7}
    }
    assert(UnitAttrsSchema.validate(helTitan))
})

it('reject unit missing required localeName', () => {
    let badCarrier = {
        cost: 3,
        spaceCombat: {dice: 1, hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    assert(!UnitAttrsSchema.validate(badCarrier, err => {}))
})

it('reject unit with bad cost type', () => {
    let badCarrier = {
        localeName: "unit.carrier",
        cost: '3',
        spaceCombat: {dice: 1, hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    assert(!UnitAttrsSchema.validate(badCarrier, err => {}))
})

it('apply default value to spaceCombat.dice', () => {
    let carrier = {
        localeName: "unit.carrier",
        spaceCombat: {hit: 9},
        move: 1,
        capacity: 4,
        ship: true
    }
    let valid = UnitAttrsSchema.validate(carrier)
    assert(valid)
    assert.equal(carrier.spaceCombat.dice, 1)
})
