const assert = require('assert')
const locale = require('../locale')
const { UnitModifierSchema } = require('./unit-modifier-schema')
const { UnitModifier, PRIORITY } = require('./unit-modifier')
const { UnitAttrs } = require('./unit-attrs')
const UNIT_MODIFIERS = require('./unit-modifier.data')
const {
    world,
    MockCard,
    MockCardDetails,
    MockPlayer,
} = require('../../mock/mock-api')

it('UNIT_MODIFIERS schema', () => {
    for (const unitModifier of UNIT_MODIFIERS) {
        assert(UnitModifierSchema.validate(unitModifier))
        assert(PRIORITY[unitModifier.priority])
    }
})

it('UNIT_MODIFIERS locale', () => {
    for (const unitModifier of UNIT_MODIFIERS) {
        const assertLocaleKey = (localKey) => {
            const s = locale(localKey)
            if (s === localKey) {
                console.error(unitModifier)
            }
            assert(s !== localKey) // yarn dev to (re)build lang
        }
        assertLocaleKey(unitModifier.localeName)
        assertLocaleKey(unitModifier.localeDescription)
    }
})

it('static sortPriorityOrder', () => {
    const mutate = new UnitModifier({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'mutate',
    })
    const adjust = new UnitModifier({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'adjust',
    })
    const choose = new UnitModifier({
        localeName: '-',
        localeDescription: '-',
        owner: 'self',
        priority: 'choose',
    })
    let modifiers = [ mutate, adjust, choose ]
    UnitModifier.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])

    modifiers = [ adjust, choose, mutate ]
    UnitModifier.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])

    modifiers = [ adjust, mutate, choose ]
    UnitModifier.sortPriorityOrder(modifiers)
    assert.deepEqual(modifiers, [ mutate, adjust, choose ])
})

it('static findPlayerUnitModifiers', () => {
    const myPlayerSlot = 7
    const player = new MockPlayer({
        slot : myPlayerSlot
    })
    const moraleBoost = new MockCard({
        cardDetails : new MockCardDetails({
            metadata : 'card.action:base/morale_boost.3'
        }),
        owningPlayerSlot : myPlayerSlot
    })
    let result
    try {
        world.__addObject(moraleBoost)
        result = UnitModifier.findPlayerUnitModifiers(player, 'self')
    } finally {
        world.__removeObject(moraleBoost)
    }
    assert.equal(result.length, 1)
    assert.equal(result[0].raw.localeName, 'unit_modifier.name.morale_boost')
})

it('applyEach', () => {
    const unitModifier = new UnitModifier({
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
    const unitModifier = new UnitModifier({
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
