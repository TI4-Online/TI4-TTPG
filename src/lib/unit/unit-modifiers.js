const assert = require('assert')
const { UnitModifiersSchema } = require('./unit-modifier-schema')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const { world } = require('../../wrapper/api')

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

let _triggerNsidToUnitModifier = false

/**
 * Manage unit modifiers.
 * 
 * Like UnitAttrs, take a static approach for gathering and applying relevant 
 * unit modifiers in the correct order.
 */
class UnitModifier {
    /**
     * Static-only class, do not instantiate it.
     */
     constructor() {
        throw new Error('Static only')
    }

    /**
     * Apply player's unit modifiers.
     * 
     * Some modifiers need to know information about the player or opponent,
     * or what / how many units are involved on one side or the other.
     * 
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {object} auxData - table of misc things modifiers might use 
     * @returns {<Array.<object>} unit modifiers, in order applied
     */
    static applyPlayerUnitModifiers(unitToUnitAttrs, auxData) {
        if (!_triggerNsidToUnitModifier) {
            _triggerNsidToUnitModifier = {}
            for (const unitModifier of UNIT_MODIFIERS) {
                if (unitModifier.triggerNsid) {
                    _triggerNsidToUnitModifier[unitModifier.triggerNsid] = unitModifier
                }
                if (unitModifier.triggerNsids) {
                    for (const triggerNsid of unitModifier.triggerNsids) {
                        _triggerNsidToUnitModifier[triggerNsid] = unitModifier
                    }
                }
            }
        }

        const unitModifiers = {}
        for (const obj of world.getAllObjects()) {
            const nsid = obj.getTemplateMetadata()
            const unitModifier = _triggerNsidToUnitModifier[nsid]
            if (!unitModifier) {
                continue
            }

            // Enfoce modifier type (self, opponent, any).
            // TODO XXX

            // TODO XXX CHECK IF IN PLAYER AREA
            // TODO XXX MAYBE USE obj.getOwningPlayerSlot IF SET?
            const insidePlayerArea = true // TODO XXX
            if (!insidePlayerArea) {
                continue
            }

            // Found a unit modifier!  Add it to the list.
            unitModifiers.push(unitModifier)
        }

        return UnitModifier.applyMultiple(unitToUnitAttrs, unitModifiers, auxData)
    }

    /**
     * Apply a single unit modifier.
     * 
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {object} unitModifier
     * @param {object} auxData - table of misc things modifiers might use
     */
    static apply(unitToUnitAttrs, unitModifier, auxData) {
        assert(UnitModifiersSchema.validate(unitModifier))
        unitModifier.apply(unitToUnitAttrs, auxData)
    }

    /**
     * Apply multiple unit modifiers, in mutate -> adjust -> choose order.
     * 
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {Array.<object>} unitModifiers
     * @param {object} auxData - table of misc things modifiers might use
     * @returns {<Array.<object>} unit modifiers, in order applied
     */
    static applyMultiple(unitToUnitAttrs, unitModifiers, auxData) {
        const priority = {
            mutate : 1,
            adjust : 2,
            choose : 3
        }
        unitModifiers.sort((a, b) => { return priority[a.type] - priority[b.type] })
        for (const unitModifier of unitModifiers) {
            unitModifier.apply(unitToUnitAttrs, unitModifier, auxData)
        }
        return unitModifiers
    }
}

module.exports = {
    UNIT_MODIFIERS,
    UnitModifier,
}