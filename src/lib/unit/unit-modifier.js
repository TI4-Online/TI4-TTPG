const assert = require('assert')
const { UnitModifiersSchema } = require('./unit-modifier-schema')

const UNIT_MODIFIERS = [
    {
        localeName: 'unit_modifier.name.morale_boost',
        localeDescription: 'unit_modifier.desc.morale_boost',
        triggerNsids: [
            'card.action:base/morale_boost.1',
            'card.action:base/morale_boost.2',
            'card.action:base/morale_boost.3',
            'card.action:base/morale_boost.4'
        ],
        owner: 'self',
        type: 'adjust',
        isCombat: true,
        apply: unitToUnitAttrs => {
            for (const unitAttrs of Object.values(unitToUnitAttrs)) {
                const attrs = unitAttrs.get()
                if (attrs.spaceCombat) {
                    attrs.spaceCombat.hit -= 1
                }
                if (attrs.groundCombat) {
                    attrs.groundCombat.hit -= 1
                }
            }
        }
    },
    // TODO MORE XXX
]

class UnitModifier {
    constructor(modifier) {
        assert(typeof modifier === 'object')
        assert(UnitModifiersSchema.validate(modifier))

        this._modifier = modifier
    }
    
    apply(unitToUnitAttrs) {
        this._modifier.apply(unitToUnitAttrs)
    }
}

module.exports = {
    UNIT_MODIFIERS,
    UnitModifier,
}