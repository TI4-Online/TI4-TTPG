const assert = require('assert')
const locale = require('../locale')
const { ObjectNamespace } = require('../object-namespace')
const { world, Card, Player } = require('../../wrapper/api')

const { UnitModifierSchema } = require('./unit-modifier-schema')
const UNIT_MODIFIERS = require('./unit-modifier.data')

const PRIORITY = {
    'mutate.early' :  9, 'mutate' : 10, 'mutate.late' : 11,
    'adjust.early' : 19, 'adjust' : 20, 'adjust.late' : 21,
    'choose.early' : 29, 'choose' : 30, 'choose.late' : 30
}

let _triggerNsidToUnitModifier = false

function _nsidToUnitModifier(nsid) {
    if (!_triggerNsidToUnitModifier) {
        _triggerNsidToUnitModifier = {}
        for (const rawModifier of UNIT_MODIFIERS) {
            const unitModifier = new UnitModifier(rawModifier)

            if (rawModifier.triggerNsid) {
                _triggerNsidToUnitModifier[rawModifier.triggerNsid] = unitModifier
            }
            if (rawModifier.triggerNsids) {
                for (const triggerNsid of rawModifier.triggerNsids) {
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
class UnitModifier {
    /**
     * Sort in apply order.
     * 
     * @param {Array.<unitModifier>} unitModifierArray 
     * @returns {Array.<unitModifier>} ordered (original list also mutated in place)
     */
    static sortPriorityOrder(unitModifierArray) {
        unitModifierArray.sort((a, b) => { return PRIORITY[a._modifier.priority] - PRIORITY[b._modifier.priority] })
        return unitModifierArray
    }

    /**
     * Find player's unit modifiers.
     * 
     * @param {Player} player 
     * @param {string} withOwner - self, opponent, any 
     * @returns {Array.<unitModifier>} modifiers in priority order
     */
    static findPlayerUnitModifiers(player, withOwner) {
        assert(player instanceof Player)
        assert(typeof withOwner === 'string')

        const unitModifiers = []
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj)
            const unitModifier = _nsidToUnitModifier(nsid)
            if (!unitModifier) {
                continue
            }

            // Cards must be face up.
            if ((obj instanceof Card) && !obj.isFaceUp()) {
                continue  // face down card
            }
            
            // Enfoce modifier type (self, opponent, any).
            if (unitModifier.raw !== 'any' && unitModifier.raw.owner !== withOwner) {
                continue  // wrong owner
            }

            // TODO XXX CHECK IF IN PLAYER AREA
            // TODO XXX MAYBE USE obj.getOwningPlayerSlot IF SET?
            const insidePlayerArea = true // TODO XXX
            if (!insidePlayerArea) {
                continue
            }

            // Found a unit modifier!  Add it to the list.
            if (!unitModifiers.includes(unitModifier)) {
                unitModifiers.push(unitModifier)
            }
        }
        return UnitModifier.sortPriorityOrder(unitModifiers)
    }

    // ------------------------------------------------------------------------

    /**
     * Constructor.
     * 
     * @param {object} modifier - UnitModifiersSchema compliant object
     */
    constructor(modifier) {
        assert(typeof modifier === 'object')
        assert(UnitModifierSchema.validate(modifier))
        this._modifier = modifier
    }

    /**
     * Localized modifier name.
     * 
     * @returns {string}
     */
     get name() {
        return locale(this._modifier.localeName)
    }

    /**
     * Localized modifier description.
     * 
     * @returns {string}
     */
     get desc() {
        return locale(this._modifier.localeDescription)
    }

    /**
     * Get the underlying object.
     * 
     * @returns {object}
     */
     get raw() {
        return this._modifier
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
    UnitModifier,
    PRIORITY
}