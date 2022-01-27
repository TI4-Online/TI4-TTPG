// This is not JSON because unit attributes can also be unit modifiers, with
// `modify = function(unitAttrs, auxData)` entries.
module.exports = [

    // Basic units.
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

    // Unit upgrades.
    {
        unit : 'carrier',
        upgradeLevel : 2,
        localeName : 'unit.carrier_2',
        triggerNsid : 'card.technology.unit_upgrade:base/carrier_2',
        move : 2, 
        capacity : 6
    },
    {
        unit : 'cruiser',
        upgradeLevel : 2,
        localeName : 'unit.cruiser_2',
        triggerNsid : 'card.technology.unit_upgrade:base/cruiser_2',
        spaceCombat : { hit : 6 }, 
        move : 3, 
        capacity : 1 
    },
    {
        unit : 'destroyer',
        upgradeLevel : 2,
        localeName : 'unit.destroyer_2',
        triggerNsid : 'card.technology.unit_upgrade:base/destroyer_2',
        antiFighterBarrage : { dice : 3, hit : 6 },
        spaceCombat : { hit : 8 }
    },
    {
        unit : 'dreadnought',
        upgradeLevel : 2,
        localeName : 'unit.dreadnought_2',
        triggerNsid : 'card.technology.unit_upgrade:base/dreadnought_2',
        move : 2
    },
    {
        unit : 'fighter',
        upgradeLevel : 2,
        localeName : 'unit.destroyer',
        triggerNsid : 'card.technology.unit_upgrade:base/destroyer_2',
        spaceCombat : { hit : 8 },
        move : 2
    },
    {
        unit : 'infantry',
        upgradeLevel : 2,
        localeName : 'unit.infantry_2',
        triggerNsid : 'card.technology.unit_upgrade:base/infantry_2',
        groundCombat : { hit : 7 }
    },
    {
        unit : 'pds',
        upgradeLevel : 2,
        localeName : 'unit.pds_2',
        triggerNsid : 'card.technology.unit_upgrade:base/pds_2',
        spaceCannon : { hit : 5, range : 1 }
    },
    {
        unit : 'space_dock',
        upgradeLevel : 2,
        localeName : 'unit.space_dock_2',
        triggerNsid : 'card.technology.unit_upgrade:base/space_dock_2',
        production : -4
    },
    {
        unit : 'war_sun',
        upgradeLevel : 2,
        localeName : 'unit.war_sun',
        triggerNsid : 'card.technology.unit_upgrade:base/war_sun',
        disablePlanetaryShield : true,
        sustainDamage : true,
        bombardment : { dice : 3, hit : 3, extraDice : 0 },
        cost : 12,
        spaceCombat : { dice : 3, hit : 3 },
        move : 2,
        capacity : 6
    },

    // Non-flagship faction units.
    {
        unit : 'carrier',
        upgradeLevel : 1,
        localeName : 'unit.carrier.advanced_carrier',
        triggerNsid : 'card.technology.unit_upgrade.sol:franken.base/advanced_carrier_1',
        capacity : 6
    },
    {
        unit : 'carrier',
        upgradeLevel : 2,
        localeName : 'unit.carrier.advanced_carrier_2',
        triggerNsid : 'card.technology.unit_upgrade.sol:base/advanced_carrier_2',
        sustainDamage : true,
        move : 2,
        capacity : 8
    },
    {
        unit : 'dreadnought',
        upgradeLevel : 1,
        localeName : 'unit.dreadnought.exotrireme',
        triggerNsid : 'card.technology.unit_upgrade.norr:franken.base/exotrireme_1',
        bombardment : { dice : 2, hit : 4 }
    },
    {
        unit : 'dreadnought',
        upgradeLevel : 2,
        localeName : 'unit.dreadnought.exotrireme_2',
        triggerNsid : 'card.technology.unit_upgrade.norr:base/exotrireme_2',
        bombardment : { dice : 2, hit : 4 },
        move : 2
    },
    {
        unit : 'space_dock',
        upgradeLevel : 1,
        localeName : 'unit.space_dock.floating_factory',
        triggerNsid : 'card.technology.unit_upgrade.saar:franken.base/floating_factory_1',
        production : 5,
        move : 1,
        capacity : 4
    },
    {
        unit : 'space_dock',
        upgradeLevel : 2,
        localeName : 'unit.space_dock.floating_factory_2',
        triggerNsid : 'card.technology.unit_upgrade.saar:base/floating_factory_2',
        production : 7,
        move : 2,
        capacity : 5
    },
    {
        unit : 'fighter',
        upgradeLevel : 1,
        localeName : 'unit.fighter.hybrid_crystal_fighter',
        triggerNsid : 'card.technology.unit_upgrade.naalu:franken.base/hybrid_crystal_fighter_1',
        spaceCombat : { hit : 8 }
    },
    {
        unit : 'fighter',
        upgradeLevel : 2,
        localeName : 'unit.fighter.hybrid_crystal_fighter_2',
        triggerNsid : 'card.technology.unit_upgrade.naalu:base/hybrid_crystal_fighter_2',
        spaceCombat : { hit : 7 },
        move : 2
    },
    {
        unit : 'infantry',
        upgradeLevel : 1,
        localeName : 'unit.infantry.letani_warrior',
        triggerNsid : 'card.technology.unit_upgrade.arborec:franken.base/letani_warrior_1',
        production : 1
    },
    {
        unit : 'infantry',
        upgradeLevel : 2,
        localeName : 'unit.infantry.letani_warrior_2',
        triggerNsid : 'card.technology.unit_upgrade.arborec:base/letani_warrior_2',
        production : 2,
        groundCombat : { hit : 7 }
    },
    {
        unit : 'war_sun',
        upgradeLevel : 1,
        localeName : 'unit.war_sun.prototype_war_sun',
        triggerNsid : 'card.technology.unit_upgrade.muaat:franken.base/prototype_war_sun_1',
        disablePlanetaryShield : true,
        sustainDamage : true,
        bombardment : { dice : 3, hit : 3 },
        cost : 12,
        spaceCombat : { dice : 3, hit : 3 },
        move : 1,
        capacity : 6
    },
    {
        unit : 'war_sun',
        upgradeLevel : 2,
        localeName : 'unit.war_sun.prototype_war_sun_2',
        triggerNsid : 'card.technology.unit_upgrade.muaat:base/prototype_war_sun_2',
        disablePlanetaryShield : true,
        sustainDamage : true,
        bombardment : { dice : 3, hit : 3 },
        cost : 10,
        spaceCombat : { dice : 3, hit : 3 },
        move : 3,
        capacity : 6
    },
    {
        unit : 'infantry',
        upgradeLevel : 1,
        localeName : 'unit.infantry.spec_ops',
        triggerNsid : 'card.technology.unit_upgrade.sol:franken.base/spec_ops_1',
        groundCombat : { hit : 7 }
    },
    {
        unit : 'infantry',
        upgradeLevel : 2,
        localeName : 'unit.infantry.spec_ops_2',
        triggerNsid : 'card.technology.unit_upgrade.sol:base/spec_ops_2',
        groundCombat : { hit : 6 }
    },
    {
        unit : 'dreadnought',
        upgradeLevel : 1,
        localeName : 'unit.dreadnought.super_dreadnought',
        triggerNsid : 'card.technology.unit_upgrade.l1z1x:franken.base/superdreadnought_1',
        capacity : 2
    },
    {
        unit : 'dreadnought',
        upgradeLevel : 2,
        localeName : 'unit.dreadnought.super_dreadnought_2',
        triggerNsid : 'card.technology.unit_upgrade.l1z1x:base/superdreadnought_2',
        bombardment : { dice : 1, hit : 4 }, spaceCombat : { hit : 4 }, move : 2, capacity : 2
    },
    {
        unit : 'destroyer',
        upgradeLevel : 1,
        localeName : 'unit.destroyer.strike_wing_alpha',
        triggerNsid : 'card.technology.unit_upgrade.argent:franken.pok/strike_wing_alpha_1',
        spaceCombat : { hit : 8 },
        capacity : 1
    },
    {
        unit : 'destroyer',
        upgradeLevel : 2,
        localeName : 'unit.destroyer.strike_wing_alpha_2',
        triggerNsid : 'card.technology.unit_upgrade.argent:pok/strike_wing_alpha_2',
        antiFighterBarrage : { dice : 3, hit : 6, extraHitsOn : { value : 9, message : '${PlayerName} destroys ${ExtraHits} of the opponent\'s Infantry in the space area.' } },
        spaceCombat : { hit : 7 },
        capacity : 1
    },
    {
        unit : 'infantry',
        upgradeLevel : 1,
        localeName : 'unit.infantry.crimson_legionnaire',
        triggerNsid : 'card.technology.unit_upgrade.mahact:franken.pok/crimson_legionnaire_1',
        groundCombat : { hit : 8 }
    },
    {
        unit : 'infantry',
        upgradeLevel : 2,
        localeName : 'unit.infantry.crimson_legionnaire_2',
        triggerNsid : 'card.technology.unit_upgrade.mahact:pok/crimson_legionnaire_2',
        groundCombat : { hit : 7 }
    },
    {
        unit : 'cruiser',
        upgradeLevel : 1,
        localeName : 'unit.cruiser.saturn_engine',
        triggerNsid : 'card.technology.unit_upgrade.ul:franken.pok/saturn_engine_1',
        spaceCombat : { hit : 7 },
        capacity : 1
    },
    {
        unit : 'cruiser',
        upgradeLevel : 2,
        localeName : 'unit.cruiser.saturn_engine_2',
        triggerNsid : 'card.technology.unit_upgrade.ul:pok/saturn_engine_2',
        spaceCombat : { hit : 6 },
        move : 3,
        capacity : 2,
        sustainDamage : true
    },
    {
        unit : 'pds',
        upgradeLevel : 1,
        localeName : 'unit.pds.hel_titan',
        triggerNsid : 'card.technology.unit_upgrade.ul:franken.pok/heltitan_1',
        groundCombat : { hit : 7, dice : 1 },
        planetaryShield : true,
        spaceCannon : { dice : 1, hit : 6, range : 0, extraDice : 0 },
        production : 1,
        sustainDamage : true
    },
    {
        unit : 'pds',
        upgradeLevel : 2,
        localeName : 'unit.pds.hel_titan_2',
        triggerNsid : 'card.technology.unit_upgrade.ul:pok/heltitan_2',
        groundCombat : { hit : 6, dice : 1 },
        planetaryShield : true,
        spaceCannon : { dice : 1, hit : 5, range : 1, extraDice : 0 },
        production : 1,
        sustainDamage : true
    },
    {
        unit : 'space_dock',
        upgradeLevel : 1,
        localeName : 'unit.space_dock.dimensional_tear',
        triggerNsid : 'card.technology.unit_upgrade.vuilraith:franken.pok/dimensional_tear_1',
        production : 5
    },
    {
        unit : 'space_dock',
        upgradeLevel : 2,
        localeName : 'unit.space_dock.dimensional_tear_2',
        triggerNsid : 'card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2',
        production : 7
    },
    


    // Flagships.
]