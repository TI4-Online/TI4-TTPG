const assert = require('../../wrapper/assert')
const _ = require('../../wrapper/lodash')
const locale = require('../locale')
const { ObjectNamespace } = require('../object-namespace')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const UNIT_ATTRS = require('./unit-attrs.data')
const { world, Card, GameObject } = require('../../wrapper/api')

let _allUnitTypes = false
let _unitToDefaultRawAttrs = false
let _triggerNsidToUnitUpgrade = false

function _getUnitUpgrade(gameObject) {
    assert(gameObject instanceof GameObject)
    if (!_triggerNsidToUnitUpgrade) {
        _triggerNsidToUnitUpgrade = {}
        for (const rawAttrs of UNIT_ATTRS) {
            if (!rawAttrs.upgradeLevel) {
                continue // basic unit, not an upgrade
            }
            const unitUpgrade = new UnitAttrs(rawAttrs)

            // Unit upgrade card.
            if (rawAttrs.triggerNsid) {
                _triggerNsidToUnitUpgrade[rawAttrs.triggerNsid] = unitUpgrade
            }

            // Faction override (list of faction units provided by each faction).
            if (rawAttrs.triggerFactionUnit) {
                // TODO XXX
            }
        }
    }
    const nsid = ObjectNamespace.getNsid(gameObject)
    return _triggerNsidToUnitUpgrade[nsid]
}

/**
 * Mutable unit attributes.  
 */
class UnitAttrs {
    /**
     * Get default UnitAttrs for unit type.  Creates a new object for mutation.
     * 
     * @param {string} unit 
     * @returns {UnitAttrs} new UnitAttrs object
     */
    static getDefaultUnitAttrs(unit) {
        if (!_unitToDefaultRawAttrs) {
            _unitToDefaultRawAttrs = {}
            for (const rawAttrs of UNIT_ATTRS) {
                if (!rawAttrs.upgradeLevel) {
                    assert(!_unitToDefaultRawAttrs[rawAttrs.unit])
                    _unitToDefaultRawAttrs[rawAttrs.unit] = rawAttrs
                }
            }
        }
        const rawAttrs = _unitToDefaultRawAttrs[unit]        
        assert(rawAttrs)
        return new UnitAttrs(rawAttrs)
    }

    /**
     * Get all normal unit types.
     * 
     * @returns {Array.<string>}
     */
    static getAllUnitTypes() {
        if (!_allUnitTypes) {
            _allUnitTypes = []
            for (const rawAttrs of UNIT_ATTRS) {
                if (!rawAttrs.upgradeLevel) {
                    assert(!_allUnitTypes.includes(rawAttrs.unit))
                    _allUnitTypes.push(rawAttrs.unit)
                }
            }
        }
        return _allUnitTypes
    }

    /**
     * Sort in increasing upgrade level order.
     * 
     * @param {Array.<UnitAttrs>} upgradeAttrsArray - unit schema compliant attrs
     * @returns {Array.<UnitAttrs>} ordered (original list also mutated in place)
     */
    static sortUpgradeLevelOrder(upgradeAttrsArray) {
        upgradeAttrsArray.sort((a, b) => { return (a._attrs.upgradeLevel || 1) - (b._attrs.upgradeLevel || 1) })
        return upgradeAttrsArray
    }

    /**
     * Find player's unit upgrades.
     * 
     * @param {number} playerSlot
     * @returns {Array.<UnitAttrs>} upgrades in level order
     */
    static getPlayerUnitUpgrades(playerSlot) {
        assert(typeof playerSlot === 'number')

        const unitUpgrades = []
        for (const obj of world.getAllObjects()) {
            const unitUpgrade = _getUnitUpgrade(obj)
            if (!unitUpgrade) {
                continue  // not a candidate
            }

            // Cards must be face up.
            if ((obj instanceof Card) && !obj.isFaceUp()) {
                continue  // face down card
            }

            // TODO XXX CHECK IF IN PLAYER AREA
            // TODO XXX MAYBE USE obj.getOwningPlayerSlot IF SET?
            const insidePlayerArea = true // TODO XXX
            if (!insidePlayerArea) {
                continue
            }

            // Found a unit upgrade!  Add it to the list.
            if (!unitUpgrades.includes(unitUpgrade)) {
                unitUpgrades.push(unitUpgrade)
            }            
        }
        return UnitAttrs.sortUpgradeLevelOrder(unitUpgrades)
    }

    // ------------------------------------------------------------------------

    /**
     * Constructor.  Makes a copy of the attrs for later mutation.
     * 
     * @param {object} attrs - UnitAttrsSchema compliant object
     */
    constructor(attrs) {
        assert(typeof attrs == 'object')
        assert(UnitAttrsSchema.validate(attrs))
        this._attrs = _.cloneDeep(attrs)
    }

    /**
     * Localized unit name, accounts for unit upgrades.
     * 
     * @returns {string}
     */
    get name() {
        return locale(this._attrs.localeName)
    }

    /**
     * Unit summary (for debugging).
     * 
     * @returns {string}
     */
    get summary() {
        return JSON.stringify(this._attrs)
    }

    /**
     * Get the mutable underlying object.
     * 
     * @returns {object}
     */
    get raw() {
        return this._attrs
    }

    /**
     * Assert this UnitAttrs complies with the schema.
     * 
     * @param {function} onError - optional, called with the error
     */
    validate(onError) {
        return UnitAttrsSchema.validate(this._attrs, onError)
    }

    /**
     * Apply unit upgrade.
     * 
     * @param {UnitAttrs} upgradeAttrs
     */
    upgrade(upgradeAttrs) {
        assert(upgradeAttrs instanceof UnitAttrs)
        assert(this._attrs.unit === upgradeAttrs._attrs.unit)
        assert(upgradeAttrs._attrs.upgradeLevel)
        assert((this._attrs.upgradeLevel || 0) <= upgradeAttrs._attrs.upgradeLevel)

        _.merge(this._attrs, upgradeAttrs._attrs)
    }
}

// Export for unittest
module.exports = {
    UnitAttrs,
}