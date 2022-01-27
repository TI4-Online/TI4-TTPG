const assert = require('assert')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const { UnitAttrs } = require('./unit-attrs')
const UNIT_ATTRS = require('./unit-attrs.data')

function getDefaultUnit(unitName) {
    for (const attrs of UNIT_ATTRS) {
        if (!attrs.upgradeLevel) {
            return new UnitAttrs(attrs)
        }
    }
    throw new Error('unknown ' + unitName)
}

function getUnitUpgrade(unitName) {
    for (const attrs of UNIT_ATTRS) {
        if ((attrs.upgradeLevel || 1) > 1) {
            return new UnitAttrs(attrs)
        }
    }
    throw new Error('unknown ' + unitName)
}


it('UNIT_ATTRS schema', () => {
    for (const attrs of UNIT_ATTRS) {
        assert(UnitAttrsSchema.validate(attrs))
    }
})

it ('static defaultUnitTypeToUnitAttrs', () => {
    const unitToAttrs = UnitAttrs.defaultUnitTypeToUnitAttrs()
    assert(unitToAttrs.fighter)
    assert(unitToAttrs.fighter instanceof UnitAttrs)
    assert.equal(unitToAttrs.fighter.raw.unit, 'fighter')
})

it('static sortUpgradeLevelOrder', () => {
    const carrier2 = getUnitUpgrade('carrier')
    const carrier3 = getUnitUpgrade('carrier')
    carrier3.raw.upgradeLevel = 3

    let upgrades = [ carrier2, carrier3 ]
    UnitAttrs.sortUpgradeLevelOrder(upgrades)
    assert.deepEqual(upgrades, [ carrier2, carrier3 ])

    upgrades = [ carrier3, carrier2 ]
    UnitAttrs.sortUpgradeLevelOrder(upgrades)
    assert.deepEqual(upgrades, [ carrier2, carrier3 ])
})

it('validate', () => {
    const carrier = getDefaultUnit('carrier')
    assert(carrier instanceof UnitAttrs)
    carrier.validate()

    carrier.raw.unit = false

    // Fail by returning a bool, empty error handler to suppress console log.
    assert(!carrier.validate(err => {}))

    // Fail using custom error handler.
    assert.throws(() => {
        carrier.validate(err => { throw new Error(err) })
    })
})

it('upgrade', () => {
    const carrier = getDefaultUnit('carrier')
    const carrier2 = getUnitUpgrade('carrier')
    assert.equal(carrier.raw.unit, 'carrier')
    assert.equal(carrier.raw.upgradeLevel, undefined)
    assert.equal(carrier.raw.move, 1)
    assert.equal(carrier2.raw.unit, 'carrier')
    assert.equal(carrier2.raw.upgradeLevel, 2)
    assert.equal(carrier2.raw.move, 2)
    carrier.upgrade(carrier2)
    assert.equal(carrier.raw.unit, 'carrier')
    assert.equal(carrier.raw.upgradeLevel, 2)
    assert.equal(carrier.raw.move, 2)
})

it('reject upgrade mismatch', () => {
    const carrier = getDefaultUnit('carrier')
    const cruiser2 = getUnitUpgrade('cruiser')
    assert.throws(() => {
        UnitAttrs.upgrade(carrier, cruiser2)
    })
})
