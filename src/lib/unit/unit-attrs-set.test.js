const assert = require('assert')
const { UnitAttrsSet } = require('./unit-attrs-set')
const { UnitAttrs } = require('./unit-attrs')

it('constructor', () => {
    const unitAttrsSet = new UnitAttrsSet()
    assert.equal(unitAttrsSet.get('fighter').raw.unit, 'fighter')
})

it('upgrade', () => {
    const unitAttrsSet = new UnitAttrsSet()
    const carrier = unitAttrsSet.get('carrier')
    assert.equal(carrier.raw.unit, 'carrier')
    assert.equal(carrier.raw.upgradeLevel, undefined)

    const carrier2 = UnitAttrs.getDefaultUnitAttrs('carrier')
    carrier2.raw.upgradeLevel = 2 // hacky pseudo-upgrade
    unitAttrsSet.upgrade(carrier2)
    assert.equal(carrier.raw.unit, 'carrier')
    assert.equal(carrier.raw.upgradeLevel, 2)
})
