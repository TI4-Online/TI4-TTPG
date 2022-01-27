const assert = require('assert')
const { world } = require('../../wrapper/api')

const { UnitModifiersSchema } = require('./unit-modifiers-schema')
const UNIT_MODIFIERS = require('./unit-modifiers.data')

let _triggerNsidToUnitModifier = false

function _nsidToUnitModifier(nsid) {
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
    return _triggerNsidToUnitModifier[nsid]
}

/**
 * A unit modifier mutates one or more unit attributes.  
 * 
 * Modifiers may have `applyEach(UnitData)` and `applyAll(UnitTypeToUnitData)`.
 * `applyEach` is for simple modifiers, called separately for each unit type.
 * `applyAll` is for modifiers that need to see all units at once, for instance
 * to choose the "best" to receive a bonus.
 */
class UnitModifiers {
    /**
     * Sort in apply order.
     * 
     * @param {Array.<unitModifier>} unitModifierArray 
     * @returns {Array.<unitModifier>} ordered (original list also mutated in place)
     */
    static sortPriorityOrder(unitModifierArray) {
        const priority = {
            mutate : 1,
            adjust : 2,
            choose : 3
        }
        unitModifierArray.sort((a, b) => { return priority[a._modifier.priority] - priority[b._modifier.priority] })
        return unitModifierArray
    }

    /**
     * Find player's unit modifiers.
     * 
     * @param {Player} player 
     * @returns {Array.<unitModifier>} modifiers in priority order
     */
    static findPlayerUnitModifiers(player) {
        const unitModifiers = []
        for (const obj of world.getAllObjects()) {
            const nsid = obj.getTemplateMetadata()
            const unitModifier = _nsidToUnitModifier(nsid)
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
        return UnitModifiers.sortPriorityOrder(unitModifiers)
    }

    // ------------------------------------------------------------------------

    /**
     * Constructor.
     * 
     * @param {object} modifier - UnitModifiersSchema compliant object
     */
    constructor(modifier) {
        assert(typeof modifier === 'object')
        assert(UnitModifiersSchema.validate(modifier))
        this._modifier = modifier
    }

    /**
     * Apply unit modifier.
     * 
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {object} auxData - table of misc things modifiers might use
     */
    apply(unitToUnitAttrs, auxData) {
        if (this._modifier.applyEach) {
            for (const unitAttrs of Object.values(unitToUnitAttrs)) {
                this._modifier.applyEach(unitAttrs, auxData)
            }
        }
        if (this._modifier.applyAll) {
            this._modifier.applyAll(unitToUnitAttrs, auxData)
        }

        // Paranoid verify modifier did not break it.
        for (const unitAttrs of Object.values(unitToUnitAttrs)) {
            assert(unitAttrs.validate())
        }
    }
}

module.exports = {
    UnitModifiers,
}