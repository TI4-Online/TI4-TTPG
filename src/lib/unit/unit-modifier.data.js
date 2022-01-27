// This is not JSON because `modify = function(unitAttrs, auxData)` functions.
module.exports = [
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
    },
    // TODO MORE XXX
]