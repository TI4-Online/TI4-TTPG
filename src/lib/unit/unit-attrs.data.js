// This is not JSON because unit attributes can also be unit modifiers, with

const { resetErrorsCount } = require("ajv/dist/compile/errors")

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
        bombardment : { dice : 1, hit : 5 },
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
        ground : true,
    },
    {
        unit : 'mech',
        localeName : 'unit.mech',
        unitNsid : 'unit:pok/mech',
        cost : 2,
        groundCombat : {dice : 1, hit : 6 },
        sustainDamage : true,
        ground : true,
    },
    {
        unit : 'pds',
        localeName : 'unit.pds',
        unitNsid : 'unit:base/pds',
        planetaryShield : true,
        spaceCannon : { dice : 1, hit : 6 },
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
        bombardment : { dice : 3, hit : 3 },
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
        antiFighterBarrage : { dice : 3, hit : 6, destroyInfantryInSpace : { value : 9 } }, // TODO XXX
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
        spaceCannon : { dice : 1, hit : 6 },
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
        spaceCannon : { dice : 1, hit : 5, range : 1 },
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
    
    // Mech.
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.aerie_sentinel',
        triggerNsid : 'card.leader.mech.argent:pok/aerie_sentinel'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.annihilator',
        triggerNsid : 'card.leader.mech.l1z1x:base/annihilator',
        bombardment : { dice : 1, hit : 8 }
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.blackshade_infiltrator',
        triggerNsid : 'card.leader.mech.yssaril:base/blackshade_infiltrator'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.dunlain_reaper',
        triggerNsid : 'card.leader.mech.letnev:base/dunlain_reaper'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.eidolon',
        triggerNsid : 'card.leader.mech.naazrokha:pok/eidolon',
        spaceCombat : {dice : 2, hit : 8, requireSpace : true },
        groundCombat : { dice : 2, hit : 6, requireGround : true }
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.ember_colossus',
        triggerNsid : 'card.leader.mech.muaat:base/ember_colossus'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.hecatoncheires',
        triggerNsid : 'card.leader.mech.ul:pok/hecatoncheires'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.icarus_drive',
        triggerNsid : 'card.leader.mech.creuss:base/icarus_drive'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.iconoclast',
        triggerNsid : 'card.leader.mech.naalu:base/iconoclast'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.indomitus',
        triggerNsid : 'card.leader.mech.xxcha:base/indomitus',
        spaceCannon : { dice : 1, hit : 8, range : 1 }
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.letani_behemoth',
        triggerNsid : 'card.leader.mech.arborec:base/letani_behemoth',
        production : 2,
        planetaryShield : true
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.moll_terminus',
        triggerNsid : 'card.leader.mech.mentak:base/moll_terminus'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.mordred',
        triggerNsid : 'card.leader.mech.nekro:base/mordred'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.moyins_ashes',
        triggerNsid : 'card.leader.mech.yin:base/moyins_ashes'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.pride_of_kenara',
        triggerNsid : 'card.leader.mech.hacan:base/pride_of_kenara'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.quantum_manipulator',
        triggerNsid : 'card.leader.mech.nomad:pok/quantum_manipulator'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.reanimator',
        triggerNsid : 'card.leader.mech.vuilraith:pok/reanimator'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.reclaimer',
        triggerNsid : 'card.leader.mech.winnu:base/reclaimer'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.scavenger_zeta',
        triggerNsid : 'card.leader.mech.saar:base/scavenger_zeta'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.shield_paling',
        triggerNsid : 'card.leader.mech.jolnar:base/shield_paling'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.starlancer',
        triggerNsid : 'card.leader.mech.mahact:pok/starlancer'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.valkyrie_exoskeleton',
        triggerNsid : 'card.leader.mech.norr:base/valkyrie_exoskeleton'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.watcher',
        triggerNsid : 'card.leader.mech.empyrean:pok/watcher'
    },
    {
        unit : 'mech',
        upgradeLevel : 1,
        localeName : 'unit.mech.zs_thunderbolt_m2',
        triggerNsid : 'card.leader.mech.sol:base/zs_thunderbolt_m2'
    },
    
    // Codex 1 (Ordinian).
    {
        unit : 'destroyer',
        upgradeLevel : 1,
        localeName : 'unit.destroyer.redacted',
        triggerNsid : 'card.technology.unit_upgrade.nekro:codex.ordinian/redacted',
        antiFighterBarrage : { dice : 3, hit : 6, destroyInfantryInSpace : { value : 9 } },
        spaceCombat : { hit : 7 },
        capacity : 1
    },

    // Flagships.
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.001',
        triggerNsid : 'card.technology.unit_upgrade.l1z1x:franken.base/001',
        spaceCombat : { dice : 2, hit : 5 },
        capacity : 5 
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.arc_secundus',
        triggerNsid : 'card.technology.unit_upgrade.letnev:franken.base/arc_secundus',
        disablePlanetaryShield : true,
        bombardment : { dice : 3, hit : 5 },
        spaceCombat : { dice : 2, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.arvicon_rex',
        triggerNsid : 'card.technology.unit_upgrade.mahact:franken.pok/arvicon_rex',
        spaceCombat : {dice : 2, hit : 5 },
        unitModifier : {
            // +2 flagship COMBAT against opponent with no token in your fleet pool
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.unit === 'flagship') {
                    // TODO XXX
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.cmorran_norr',
        triggerNsid : 'card.technology.unit_upgrade.norr:franken.base/cmorran_norr',
        spaceCombat : { dice : 2, hit : 6 },
        unitModifier : {
            // +1 to all COMBAT rolls for other ships with the C'morran N'orr
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.ship &&
                    unitAttrs.raw.unit !== 'flagship' &&
                    unitAttrs.raw.spaceCombat) {
                    unitAttrs.raw.spaceCombat.hit -= 1
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.duha_menaimon',
        triggerNsid : 'card.technology.unit_upgrade.arborec:franken.base/duha_menaimon',
        spaceCombat : { dice : 2, hit : 7 },
        capacity : 5
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.dynamo',
        triggerNsid : 'card.technology.unit_upgrade.empyrean:franken.pok/dynamo',
        spaceCombat : { dice : 2, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.fourth_moon',
        triggerNsid : 'card.technology.unit_upgrade.mentak:franken.base/fourth_moon',
        spaceCombat : { dice : 2, hit : 7 },
        unitModifier : {
            // Opponent's ships cannot use SUSTAIN DAMAGE
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'opponent',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.ship && 
                    unitAttrs.raw.sustainDamage) {
                    unitAttrs.raw.sustainDamage = false
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.genesis',
        triggerNsid : 'card.technology.unit_upgrade.sol:franken.base/genesis',
        spaceCombat : { dice : 2, hit : 5 },
        capacity : 12
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.hil_colish',
        triggerNsid : 'card.technology.unit_upgrade.creuss:franken.base/hil_colish',
        spaceCombat : { dice : 1, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.jns_hylarim',
        triggerNsid : 'card.technology.unit_upgrade.jolnar:franken.base/jns_hylarim',
        spaceCombat : { dice : 2, hit : 6, extraHitsOn : { count : 2, value : 9 } }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.loncara_ssodu',
        triggerNsid : 'card.technology.unit_upgrade.xxcha:franken.base/loncara_ssodu',
        spaceCannon : { dice : 3, hit : 5, range : 1 },
        spaceCombat : { dice : 2, hit : 7 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.matriarch',
        triggerNsid : 'card.technology.unit_upgrade.naalu:franken.base/matriarch',
        spaceCombat : { dice : 2, hit : 9 },
        capacity : 6,
        unitModifier : {
            // Fighters may participate in ground combat
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.unit === 'fighter' &&
                    !unitAttrs.raw.groundCombat) {
                    unitAttrs.raw.groundCombat = {
                        dice: unitAttrs.raw.spaceCombat.dice,
                        hit: unitAttrs.raw.spaceCombat.hit,
                    }
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.memoria_i',
        triggerNsid : 'card.technology.unit_upgrade.nomad:franken.pok/memoria_1',
        antiFighterBarrage : { dice : 3, hit : 8 },
        spaceCombat : { dice : 2, hit : 7 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.memoria_ii',
        triggerNsid : 'card.technology.unit_upgrade.nomad:pok/memoria_2',
        antiFighterBarrage : { dice : 3, hit : 5 },
        spaceCombat : { dice : 2, hit : 5 },
        capacity : 6
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.ouranos',
        triggerNsid : 'card.technology.unit_upgrade.ul:franken.pok/ouranos',
        spaceCombat : { dice : 2, hit : 7 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.quetzecoatl',
        triggerNsid : 'card.technology.unit_upgrade.argent:franken.pok/quetzecoatl',
        spaceCombat : { dice : 2, hit : 7 },
        unitModifier : {
            // Other players cannot use SPACE CANNON against your ships in this system
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'opponent',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.spaceCannon) {
                    delete unitAttrs.raw.spaceCannon
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.salai_sai_corian',
        triggerNsid : 'card.technology.unit_upgrade.winnu:franken.base/salai_sai_corian',
        spaceCombat : { dice : 1, hit : 7 },
        unitModifier : {
            // Rolls number of dice equal to number of opponent's non-fighter ships
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.unit === 'flagship') {
                    // XXX TODO
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.son_of_ragh',
        triggerNsid : 'card.technology.unit_upgrade.saar:franken.base/son_of_ragh',
        antiFighterBarrage : { dice : 4, hit : 6 },
        spaceCombat : { dice : 2, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.the_alastor',
        triggerNsid : 'card.technology.unit_upgrade.nekro:franken.base/the_alastor',
        spaceCombat : { dice : 2, hit : 9 },
        unitModifier : {
            // Ground forces may participate in space combat
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.ground &&
                    unitAttrs.raw.groundCombat &&
                    !unitAttrs.raw.spaceCombat) {
                    unitAttrs.raw.spaceCombat = {
                        dice : unitAttrs.groundCombat.dice,
                        hit : unitAttrs.groundCombat.hit,
                    }
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.the_inferno',
        triggerNsid : 'card.technology.unit_upgrade.muaat:franken.base/the_inferno',
        spaceCombat : { dice : 2, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.the_terror_between',
        triggerNsid : 'card.technology.unit_upgrade.vuilraith:franken.pok/the_terror_between',
        spaceCombat : { dice : 2, hit : 5 },
        bombardment : { dice : 1, hit : 5 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.van_hauge',
        triggerNsid : 'card.technology.unit_upgrade.yin:franken.base/van_hauge',
        spaceCombat : { dice : 2, hit : 9 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.visz_el_vir',
        triggerNsid : 'card.technology.unit_upgrade.naazrokha:franken.pok/visz_el_vir',
        spaceCombat : {  dice : 2, hit : 9 },
        capacity : 4,
        unitModifier : {
            // Your mechs in this system roll 1 additional die during combat
            localeName : 'TODO XXX',
            localeDescription : 'TODO XXX',
            owner : 'self',
            priority : 'adjust',
            applyEach : (unitAttrs, auxData) => {
                if (unitAttrs.raw.unit === 'mech' &&
                    unitAttrs.raw.groundCombat) {
                    unitAttrs.raw.groundCombat.dice += 1
                }
            }
        }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.wrath_of_kenara',
        triggerNsid : 'card.technology.unit_upgrade.hacan:franken.base/wrath_of_kenara',
        spaceCombat : { dice : 2, hit : 7 }
    },
    {
        unit : 'flagship',
        upgradeLevel : 1,
        localeName : 'unit.flagship.ysia_yssrila',
        triggerNsid : 'card.technology.unit_upgrade.yssaril:franken.base/ysia_yssrila',
        spaceCombat : { dice : 2, hit : 5 },
        move : 2
    },
]