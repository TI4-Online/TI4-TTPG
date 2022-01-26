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
 * Unit attributes for a given unit type.
 */
class UnitAttrs {
    /**
     * Get a map from base unit string to UnitAttrs Objects.
     * @returns {object}
     */
    static default() {
        const result = {}
        for (const attrs of BASE_UNITS) {
            result[attrs.unit] = new UnitAttrs(attrs)
        }
        return result
    }

    /**
     * Constructor.
     * 
     * @param {object} baseAttrs - unit schema compliant attrs
     */
    constructor(baseAttrs) {
        assert(typeof baseAttrs === 'object')
        assert(UnitAttrsSchema.validate(baseAttrs))

        // Copy base attrs for safe mutation later.
        this._attrs = _.cloneDeep(baseAttrs)
    }

    /**
     * Apply unit upgrade.
     * 
     * @param {object} upgradeAttrs - unit schema compliant attrs
     */
    upgrade(upgradeAttrs) {
        assert(typeof upgradeAttrs === 'object')
        assert(UnitAttrsSchema.validate(upgradeAttrs))
        assert(upgradeAttrs.unit === this._attrs.unit)

        _.merge(this._attrs, upgradeAttrs)
    }

    /**
     * Get mutable unit attributes.
     * 
     * @returns {object} unit schema compliant attrs
     */
    get() {
        return this._attrs
    }

    /**
     * Verify unit still follows schema.
     * 
     * @returns {boolean} true if valid
     */
    validate() {
        return UnitAttrsSchema.validate(this._attrs)
    }
}

// Export for unittest
module.exports = {
    BASE_UNITS,
    UNIT_UPGRADES,
    UnitAttrs,
}