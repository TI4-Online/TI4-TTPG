const assert = require('assert')
const _ = require('lodash')
const { UnitAttrsSchema } = require('./unit-attrs-schema')

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
        spaceCombat : { hit : 6 }, 
        move : 3, 
        capacity : 1 
    },
    // TODO MORE XXX
]

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
        for (const upgrade of UNIT_UPGRADES) {
            assert(UnitAttrsSchema.validate(upgrade))
            result[upgrade.unit] = _.cloneDeep(upgrade)
        }
        return result
    }

    /**
     * Apply unit upgrade, overwrites original in place.
     * 
     * @param {object} unitAttrs - unit schema compliant attrs
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
}

// Export for unittest
module.exports = {
    BASE_UNITS,
    UNIT_UPGRADES,
    UnitAttrs,
}