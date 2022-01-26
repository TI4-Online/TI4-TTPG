const assert = require('assert')
const _ = require('lodash')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const { world } = require('../../wrapper/api')

const BASE_UNITS = [
    {
        unit : 'carrier',
        localeName : 'unit.carrier',
        unitNsid : 'unit:base/carrier',
        cost : 3,
        spaceCombat : { dice : 1, hit : 9 },
        move : 1,
        capacity : 4,
        ship : true,
    },
    {
        unit : 'cruiser',
        localeName : 'unit.cruiser',
        unitNsid : 'unit:base/cruiser',
        cost : 2,
        spaceCombat : { dice : 1, hit : 7 },
        move : 2,
        ship : true,
    },
    {
        unit : 'destroyer',
        localeName : 'unit.destroyer',
        unitNsid : 'unit:base/destroyer',
        antiFighterBarrage : { dice : 2, hit : 9 },
        cost : 1,
        spaceCombat : { dice : 1, hit : 9 },
        move : 2,
        ship : true,
    },
    {
        unit : 'dreadnought',
        localeName : 'unit.dreadnought',
        unitNsid : 'unit:base/dreadnought',
        sustainDamage : true,
        bombardment : { dice : 1, hit : 5, extraDice : 0 },
        cost : 4,
        spaceCombat : { dice : 1, hit : 5 },
        move : 1,
        capacity : 1,
        ship : true,
    },
    {
        unit : 'fighter',
        localeName : 'unit.fighter',
        unitNsid : 'unit:base/fighter',
        cost : 1,
        produce : 2,
        spaceCombat : { dice : 1, hit : 9 },
        ship : true,
    },
    {
        unit : 'flagship',
        localeName : 'unit.flagship',
        unitNsid : 'unit:base/flagship',
        sustainDamage : true,
        cost : 8,
        move : 1,
        capacity : 3,
        ship : true,
    },
    {
        unit : 'infantry',
        localeName : 'unit.infantry',
        unitNsid : 'unit:base/infantry',
        cost : 1,
        produce : 2,
        groundCombat : { dice : 1, hit : 8 },
    },
    {
        unit : 'mech',
        localeName : 'unit.mech',
        unitNsid : 'unit:pok/mech',
        cost : 2,
        groundCombat : {dice : 1, hit : 6 },
        sustainDamage : true,
    },
    {
        unit : 'pds',
        localeName : 'unit.pds',
        unitNsid : 'unit:base/pds',
        planetaryShield : true,
        spaceCannon : { dice : 1, hit : 6, range : 0, extraDice : 0 },
        structure : true,
    },
    {
        unit : 'space_dock',
        localeName : 'unit.space_dock',
        unitNsid : 'unit:base/space_dock',
        production : -2,
        structure : true,
    },
    {
        unit : 'war_sun',
        localeName : 'unit.war_sun',
        unitNsid : 'unit:base/war_sun',
        ship : true,
    },
]

const UNIT_UPGRADES = [
    {
        unit : 'carrier',
        level : 2,
        localeName : 'unit.carrier_2',
        triggerNsid : 'card.technology.unit_upgrade:base/carrier_2',
        move : 2, 
        capacity : 6
    },
    {
        unit : 'cruiser',
        level : 2,
        localeName : 'unit.cruiser_2',
        triggerNsid : 'card.technology.unit_upgrade:base/cruiser_2',
        spaceCombat : { hit : 6 }, 
        move : 3, 
        capacity : 1 
    },
    // TODO MORE XXX
]

let _triggerNsidToUnitUpgrade = false

/**
 * Manage unit attributes.  
 * 
 * Do not make this a proper class so consumers can use simple traversal like 
 * `attrs.spaceCombat.hit`.  Moreover who knows what homebrewers might want 
 * to do with unit modifiers, keeping things as simple tables is flexible.
 */
class UnitAttrs {
    /**
     * Static-only class, do not instantiate it.
     */
     constructor() {
        throw new Error('Static only')
    }

    /**
     * Get a map from base unit string to unitAttr objects.
     * Copy unitAttr tables so owner is free to mutate them.
     * 
     * @returns {object}
     */
    static defaultUnitToUnitAttrs() {
        const result = {}
        for (const attrs of BASE_UNITS) {
            assert(UnitAttrsSchema.validate(attrs))
            result[attrs.unit] = _.cloneDeep(attrs)
        }
        return result
    }

    /**
     * Get a map from base unit string to unitAttr upgrades.
     * This is primarily for unittest support.
     * 
     * @returns {object}
     */
    static defaultUnitToUnitUpgrade() {
        const result = {}
        for (const unitUpgrade of UNIT_UPGRADES) {
            assert(UnitAttrsSchema.validate(unitUpgrade))
            result[unitUpgrade.unit] = _.cloneDeep(unitUpgrade)
        }
        return result
    }

    /**
     * Apply player's unit upgrades.
     * 
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {Player} player 
     */
    static applyPlayerUnitUpgrades(unitToUnitAttrs, player) {
        if (!_triggerNsidToUnitUpgrade) {
            _triggerNsidToUnitUpgrade = {}
            for (const unitUpgrade of UNIT_UPGRADES) {
                if (unitUpgrade.triggerNsid) {
                    _triggerNsidToUnitUpgrade[unitUpgrade.triggerNsid] = unitUpgrade
                }
            }
        }

        const unitToUnitUpgrades = {}
        for (const obj of world.getAllObjects()) {
            const nsid = obj.getTemplateMetadata()
            const unitUpgrade = _triggerNsidToUnitUpgrade[nsid]
            if (!unitUpgrade) {
                continue
            }

            // TODO XXX CHECK IF IN PLAYER AREA
            // TODO XXX MAYBE USE obj.getOwningPlayerSlot IF SET?
            const insidePlayerArea = true // TODO XXX
            if (!insidePlayerArea) {
                continue
            }

            // Found a unit upgrade!  Add it to the list.
            if (!unitToUnitUpgrades[unitUpgrade.unit]) {
                unitToUnitUpgrades[unitUpgrade.unit] = []
            }
            unitToUnitUpgrades[unitUpgrade.unit].push(unitUpgrade)
        }

        for (const [unit, unitUpgrades] of Object.entries(unitToUnitUpgrades)) {
            UnitAttrs.upgradeMultiple(unitToUnitAttrs[unit], unitUpgrades)
        }
    }

    /**
     * Apply unit upgrade, overwrites original in place.
     * 
     * @param {object} unitAttrs - unit schema compliant attrs, mutated in place
     * @param {object} upgradeAttrs - unit schema compliant attrs
     */
    static upgrade(unitAttrs, upgradeAttrs) {
        assert(typeof unitAttrs === 'object')
        assert(typeof upgradeAttrs === 'object')
        assert(unitAttrs.unit === upgradeAttrs.unit)
        assert(typeof upgradeAttrs.level === 'number')
        assert((!unitAttrs.level) || unitAttrs.level <= upgradeAttrs.level)
        
        assert(UnitAttrsSchema.validate(unitAttrs))
        assert(UnitAttrsSchema.validate(upgradeAttrs))

        _.merge(unitAttrs, upgradeAttrs)
    }

    /**
     * Apply unit upgrade, overwrites original in place.
     * Upgrades are applied in level order (e.g Franken level 1 + 2).
     * 
     * @param {object} unitAttrs - unit schema compliant attrs, mutated in place
     * @param {Array.<object>} upgradeAttrsArray - unit schema compliant attrs
     */
    static upgradeMultiple(unitAttrs, upgradeAttrsArray) {
        upgradeAttrsArray.sort((a, b) => { return (a.level || 1) - (b.level || 1) })
        for (const upgradeAttrs of upgradeAttrsArray) {
            UnitAttrs.upgrade(unitAttrs, upgradeAttrs)
        }
    }
}

// Export for unittest
module.exports = {
    BASE_UNITS,
    UNIT_UPGRADES,
    UnitAttrs,
}