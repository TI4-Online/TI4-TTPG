const assert = require('assert')
const _ = require('lodash')
const { world } = require('../../wrapper/api')

const { UnitAttrsSchema } = require('./unit-attrs-schema')
const UNIT_ATTRS = require('./unit-attrs.data')

let _triggerNsidToUnitUpgrade = false

/**
 * Manage mutable unit attributes.  
 */
class UnitAttrs {
    /**
     * Get a map from base unit string to UnitAttr Objects.
     * 
     * @returns {Object.<string, UnitAttrs>}
     */
     static defaultUnitTypeToUnitAttrs() {
        const result = {}
        for (const attrs of UNIT_ATTRS) {
            if (!attrs.upgradeLevel) {
                result[attrs.unit] = new UnitAttrs(attrs)
            }
        }
        return result
    }

    /**
     * Constructor.  Makes a copy of the attrs for later mutation.
     * 
     * @param {object} attrs - UnitAttrsSchema complient object
     */
    constructor(attrs) {
        assert(typeof attrs == 'object')
        assert(UnitAttrsSchema.validate(attrs))
        this._attrs = _.cloneDeep(attrs)
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
     */
    validate() {
        UnitAttrsSchema.validate(this._attrs, err => { throw new Error(err) })
    }

    /**
     * Apply unit upgrade.
     * 
     * @param {UnitAttrs} upgradeAttrs
     */
    upgrade(upgradeAttrs) {
        assert(upgradeAttrs instanceof UnitAttrs)
        assert(this._attrs.unit === upgradeAttrs.raw.unit)
        assert(upgradeAttrs.raw.upgradeLevel)
        assert((this._attrs.upgradeLevel || 0) <= upgradeAttrs.raw.upgradeLevel)

        _.merge(this._attrs, upgradeAttrs.raw)
    }

    /**
     * Apply unit upgrades, in level order.
     * 
     * @param {Array.<UnitAttrs>} upgradeAttrsArray - unit schema compliant attrs
     * @returns {Array.<UnitAttrs>} apply order
     */
    upgradeMultiple(upgradeAttrsArray) {
        upgradeAttrsArray.sort((a, b) => { return (a.raw.upgradeLevel || 1) - (b.raw.upgradeLevel || 1) })
        for (const upgradeAttrs of upgradeAttrsArray) {
            this.upgrade(upgradeAttrs)
        }
        return upgradeAttrsArray
    }

    /**
     * Apply player's unit upgrades.
     * 
     * @param {Player} player 
     */
    applyPlayerUnitUpgrades(player) {
        if (!_triggerNsidToUnitUpgrade) {
            _triggerNsidToUnitUpgrade = {}
            for (const unitUpgrade of UNIT_ATTRS) {
                if (!unitUpgrade.upgradeLevel) {
                    continue // basic unit, not an upgrade
                }

                // Unit upgrade card.
                if (unitUpgrade.triggerNsid) {
                    _triggerNsidToUnitUpgrade[unitUpgrade.triggerNsid] = unitUpgrade
                }

                // Faction override (list of faction units provided by each faction).
                if (unitUpgrade.triggerFactionUnit) {
                    // TODO XXX
                }
            }
        }

        const unitUpgrades = {}
        for (const obj of world.getAllObjects()) {
            const nsid = obj.getTemplateMetadata()
            const unitUpgrade = _triggerNsidToUnitUpgrade[nsid]
            if (!unitUpgrade) {
                continue  // not a candidate
            }

            if (unitUpgrade.unit !== this._attrs.unit) {
                continue  // unit upgrade, but for different unit type
            }

            // TODO XXX CHECK IF IN PLAYER AREA
            // TODO XXX MAYBE USE obj.getOwningPlayerSlot IF SET?
            const insidePlayerArea = true // TODO XXX
            if (!insidePlayerArea) {
                continue
            }

            unitUpgrades.push(unitUpgrade)
        }
        this.upgradeMultiple(unitUpgrades)
    }
    
}

// Export for unittest
module.exports = {
    UnitAttrs,
}