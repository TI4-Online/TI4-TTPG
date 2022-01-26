const assert = require('assert')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const { UnitAttrs } = require('./unit-attrs')
const {
    BASE_UNITS,
    UNIT_UPGRADES,
} = require('./unit-attrs')

it('validate BASE_UNITS schema', () => {
    for (const unitAttrs of BASE_UNITS) {
        const isValid = UnitAttrsSchema.validate(unitAttrs)
        assert(isValid, `rejected BASE_UNIT schema`)
    }
})

it('validate UNIT_UPGRADE schema', () => {
    for (const unitAttrs of UNIT_UPGRADES) {
        const isValid = UnitAttrsSchema.validate(unitAttrs)
        assert(isValid, `rejected UNIT_UPGRADE schema`)
    }
})

it ('static default', () => {
    const unitToAttrs = UnitAttrs.default()
    assert(unitToAttrs['fighter'])
    assert.equal(unitToAttrs['fighter'].get().unit, 'fighter')
})

it ('upgrade', () => {
    const unitAttrs = new UnitAttrs({
        unit : 'carrier',
        localeName : 'unit.carrier',
        unitNsid : 'unit:base/carrier',
        cost : 3,
        spaceCombat : { dice : 1, hit : 9 },
        move : 1,
        capacity : 4,
        ship : true,
    })
    assert.equal(unitAttrs.get().unit, 'carrier')
    assert.equal(unitAttrs.get().level, 1) // schema validation fills in defaults
    assert.equal(unitAttrs.get().move, 1)
    unitAttrs.upgrade({
        unit : 'carrier',
        level : 2,
        localeName : 'unit.carrier_2',
        triggerNsid : 'card.technology.unit_upgrade:base/carrier_2',
        move : 2, 
        capacity : 6
    })
    assert.equal(unitAttrs.get().unit, 'carrier')
    assert.equal(unitAttrs.get().level, 2)
    assert.equal(unitAttrs.get().move, 2)
})

it('reject upgrade mismatch', () => {
    const unitAttrs = new UnitAttrs({
        unit : 'carrier',
        localeName : 'unit.carrier',
        unitNsid : 'unit:base/carrier',
        cost : 3,
        spaceCombat : { dice : 1, hit : 9 },
        move : 1,
        capacity : 4,
        ship : true,
    })
    assert.equal(unitAttrs.get().unit, 'carrier')
    assert.equal(unitAttrs.get().level, 1) // schema validation fills in defaults
    assert.equal(unitAttrs.get().move, 1)
    assert.throws(() => {
        unitAttrs.upgrade({
            unit : 'cruiser',
            level : 2,
            localeName : 'unit.cruiser_2',
            spaceCombat : { hit : 6 }, 
            move : 3, 
            capacity : 1 
        })
    })
})
