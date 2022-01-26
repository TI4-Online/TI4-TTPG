const assert = require('assert')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const { UnitAttrs } = require('./unit-attrs')
const {
    BASE_UNITS,
    UNIT_UPGRADES,
} = require('./unit-attrs')
const { UnitModifiers } = require('./unit-modifiers')

it('static only', () => {
    assert.throws(() => { new UnitAttrs() })
})

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

it ('defaultUnitToUnitAttrs', () => {
    const unitToAttrs = UnitAttrs.defaultUnitToUnitAttrs()
    assert(unitToAttrs.fighter)
    assert.equal(unitToAttrs.fighter.unit, 'fighter')
})

it ('upgrade', () => {
    const carrier = UnitAttrs.defaultUnitToUnitAttrs().carrier
    const carrier2 = UnitAttrs.defaultUnitToUnitUpgrade().carrier
    assert.equal(carrier.unit, 'carrier')
    assert.equal(carrier.move, 1)
    UnitAttrs.upgrade(carrier, carrier2) // mutates carrier in place
    assert.equal(carrier.unit, 'carrier')
    assert.equal(carrier.level, 2)
    assert.equal(carrier.move, 2)
})

it('reject upgrade mismatch', () => {
    const carrier = UnitAttrs.defaultUnitToUnitAttrs().carrier
    const cruiser2 = UnitAttrs.defaultUnitToUnitUpgrade().cruiser
    assert.throws(() => {
        UnitAttrs.upgrade(carrier, cruiser2)
    })
})

it('upgradeMultiple', () => {
    const carrier2 = UnitAttrs.defaultUnitToUnitUpgrade().carrier

    const carrier3 = UnitAttrs.defaultUnitToUnitUpgrade().carrier
    carrier3.level = 3

    let carrier = UnitAttrs.defaultUnitToUnitAttrs().carrier
    let unitUpgrades = [ carrier2, carrier3 ]
    UnitAttrs.upgradeMultiple(carrier, unitUpgrades)
    assert.deepEqual(unitUpgrades, [ carrier2, carrier3 ])

    carrier = UnitAttrs.defaultUnitToUnitAttrs().carrier // reset
    unitUpgrades = [ carrier3, carrier2 ]
    UnitAttrs.upgradeMultiple(carrier, unitUpgrades)
    assert.deepEqual(unitUpgrades, [ carrier2, carrier3 ])
})
