const assert = require("assert")

const BASE_UNIT = {
    carrier : {
        localeName : 'unit.carrier',
        unitNsid : 'unit:base/carrier',
        cost : 3,
        spaceCombat : { dice : 1, hit : 9 },
        move : 1,
        capacity : 4,
        ship : true,
    },
    cruiser : {
        localeName : 'unit.cruiser',
        unitNsid : 'unit:base/cruiser',
        cost : 2,
        spaceCombat : { dice : 1, hit : 7 },
        move : 2,
        ship : true,
    },
    destroyer : {
        localeName : 'unit.destroyer',
        unitNsid : 'unit:base/destroyer',
        antiFighterBarrage : { dice : 2, hit : 9 },
        cost : 1,
        spaceCombat : { dice : 1, hit : 9 },
        move : 2,
        ship : true,
    },
    dreadnought : {
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
    fighter : {
        localeName : 'unit.fighter',
        unitNsid : 'unit:base/fighter',
        cost : 1,
        produce : 2,
        spaceCombat : { dice : 1, hit : 9 },
        ship : true,
    },
    flagship : {
        localeName : 'unit.flagship',
        unitNsid : 'unit:base/flagship',
        sustainDamage : true,
        cost : 8,
        move : 1,
        capacity : 3,
        ship : true,
    },
    infantry : {
        localeName : 'unit.infantry',
        unitNsid : 'unit:base/infantry',
        cost : 1,
        produce : 2,
        groundCombat : { dice : 1, hit : 8 },
    },
    mech : {
        localeName : 'unit.mech',
        unitNsid : 'unit:pok/mech',
        cost : 2,
        groundCombat : {dice : 1, hit : 6 },
        sustainDamage : true,
    },
    pds : {
        localeName : 'unit.pds',
        unitNsid : 'unit:base/pds',
        planetaryShield : true,
        spaceCannon : { dice : 1, hit : 6, range : 0, extraDice : 0 },
        structure : true,
    },
    space_dock : {
        localeName : 'unit.space_dock',
        unitNsid : 'unit:base/space_dock',
        production : -2,
        structure : true,
    },
    war_sun : {
        localeName : 'unit.war_sun',
        unitNsid : 'unit:base/war_sun',
        ship : true,
    },
}

const UNIT_UPGRADE = {
    carrier_2 : {
        localeName : 'unit.carrier_2',
        triggerNsids : [ 'card.technology.unit_upgrade:base/carrier_2' ], // XXX TODO
        upgrade : { unit : 'carrier', level : 2 },
        move : 2, 
        capacity : 6
    },
}

class UnitAttrs {
    /**
     * Constructor.
     * 
     * @param {string} unit - BASE_UNIT key naming unit attributes
     */
    constructor(unit) {
        assert(typeof unit === 'string')

        this._unit = unit
        this._attrs = {}

        // COPY base unit entry for safe mutation later.
        // Allow new units to be created.
        const copyAttrs = BASE_UNIT[unit] || {}
        // TODO XXX
    }

    upgrade(unitAttrs) {
        assert(unitAttrs.upgrade.unit === this._unit)
        // TODO XXX
    }
}

// Export for unittest
module.exports = {
    BASE_UNIT,
    UNIT_UPGRADE,
}