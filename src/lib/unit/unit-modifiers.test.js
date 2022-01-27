const assert = require('assert')
const { UnitModifiersSchema } = require('./unit-modifiers-schema')
const { UnitModifiers } = require('./unit-modifiers')
const { UnitAttrs } = require('./unit-attrs')
const UNIT_MODIFIERS = require('./unit-modifiers.data')

it('UNIT_MODIFIERS schema', () => {
    for (const unitModifier of UNIT_MODIFIERS) {
        assert(UnitModifiersSchema.validate(unitModifier))
    }
})

it('static sortPriorityOrder', () => {
    const mutate = new UnitModifiers({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'mutate',
    })
    const adjust = new UnitModifiers({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'adjust',
    })
    const choose = new UnitModifiers({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'choose',
    })
    let modifiers = [ mutate, adjust, choose ]
    UnitModifiers.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])

    modifiers = [ adjust, choose, mutate ]
    UnitModifiers.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])

    modifiers = [ adjust, mutate, choose ]
    UnitModifiers.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])
})

it('applyEach', () => {
    const unitModifier = new UnitModifiers({
        localeName: 'unit_modifier.name.morale_boost',
        localeDescription: 'unit_modifier.desc.morale_boost',
        triggerNsids: [
            'card.action:base/morale_boost.1',
            'card.action:base/morale_boost.2',
            'card.action:base/morale_boost.3',
            'card.action:base/morale_boost.4'
        ],
        owner: 'self',
        priority: 'adjust',
        isCombat: true,
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1
            }
        }
    })

    const unitToUnitAttrs = UnitAttrs.defaultUnitTypeToUnitAttrs()
    assert.equal(unitToUnitAttrs.fighter.raw.spaceCombat.hit, 9)
    assert.equal(unitToUnitAttrs.infantry.raw.groundCombat.hit, 8)

    unitModifier.apply(unitToUnitAttrs, unitModifier)
    assert.equal(unitToUnitAttrs.fighter.raw.spaceCombat.hit, 8)
    assert.equal(unitToUnitAttrs.infantry.raw.groundCombat.hit, 7)
})

it('applyAll', () => {
    const unitModifier = new UnitModifiers({
        localeName: 'unit_modifier.name.morale_boost',
        localeDescription: 'unit_modifier.desc.morale_boost',
        triggerNsids: [
            'card.action:base/morale_boost.1',
            'card.action:base/morale_boost.2',
            'card.action:base/morale_boost.3',
            'card.action:base/morale_boost.4'
        ],
        owner: 'self',
        priority: 'adjust',
        isCombat: true,
        applyAll: (unitToUnitAttrs, auxData) => {
            for (const unitAttrs of Object.values(unitToUnitAttrs)) {
                if (unitAttrs.raw.spaceCombat) {
                    unitAttrs.raw.spaceCombat.hit -= 1
                }
                if (unitAttrs.raw.groundCombat) {
                    unitAttrs.raw.groundCombat.hit -= 1
                }
            }
        }
    })

    const unitToUnitAttrs = UnitAttrs.defaultUnitTypeToUnitAttrs()
    assert.equal(unitToUnitAttrs.fighter.raw.spaceCombat.hit, 9)
    assert.equal(unitToUnitAttrs.infantry.raw.groundCombat.hit, 8)

    unitModifier.apply(unitToUnitAttrs, unitModifier)
    assert.equal(unitToUnitAttrs.fighter.raw.spaceCombat.hit, 8)
    assert.equal(unitToUnitAttrs.infantry.raw.groundCombat.hit, 7)
})
