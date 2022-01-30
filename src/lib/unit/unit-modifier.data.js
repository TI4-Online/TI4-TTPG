const { ObjectNamespace } = require("../object-namespace")
const { UnitAttrs } = require("./unit-attrs")
const { world } = require("../../wrapper/api")

// This is not JSON because `modify = function(unitAttrs, auxData)` functions.
module.exports = [
    {
        // "PLANETARY SHIELD does not prevent BOMBARDMENT",
        isCombat: true,
        localeName: "unit_modifier.name.2ram",
        localeDescription: "unit_modifier.desc.2ram",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.leader.commander.l1z1x:base/2ram",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.disablePlanetaryShield = true
            }
        }
    },
    {
        // "-1 to all SPACE CANNON rolls",
        isCombat: true,
        localeName: "unit_modifier.name.antimass_deflectors",
        localeDescription: "unit_modifier.desc.antimass_deflectors",
        owner: "opponent",
        priority: "adjust",
        triggerNsid: "card.technology.blue:base/antimass_deflectors",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCannon) {
                unitAttrs.raw.spaceCannon.hit += 1
            }
        }
    },
    {
        // "Mechs lose non-SUSTAIN DAMAGE abilities",
        isCombat: true,
        localeName: "unit_modifier.name.articles_of_war",
        localeDescription: "unit_modifier.desc.articles_of_war",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.agenda:pok/articles_of_war",
        applyAll: (unitAttrsSet, auxData) => {
            const mechAttrs = unitAttrsSet.get('mech')
            delete mechAttrs.raw.antiFighterBarrage
            delete mechAttrs.raw.bombardment
            delete mechAttrs.raw.roduction
            delete mechAttrs.raw.spaceCannon
        }
    },
    {
        // "BOMBARDMENT 6 to non-fighter, non-bomdbardment ships",
        isCombat: true,
        localeName: "unit_modifier.name.blitz",
        localeDescription: "unit_modifier.desc.blitz",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.action:codex.ordinian/blitz",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.ship &&
                unitAttrs.raw.unit !== 'fighter' &&
                !unitAttrs.raw.bombardment) {
                unitAttrs.raw.bombardment = { dice: 1, hit: 6 }
            }
        }
    },
    {
        // "Produce an additional Infantry for their cost; it doesn't count towards production limits.",
        isCombat: false,
        localeName: "unit_modifier.name.brother_omar",
        localeDescription: "unit_modifier.desc.brother_omar",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.leader.commander.yin:pok/brother_omar",
        applyAll: (unitAttrsSet, auxData) => {
            const infantryAttrs = unitAttrsSet.get('infantry')
            infantryAttrs.raw.produce += 1
            infantryAttrs.raw.freeProduce = (infantryAttrs.raw.freeProduce || 0) + 1
        }
    },
    {
        // "-4 to all BOMBARDMENT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.bunker",
        localeDescription: "unit_modifier.desc.bunker",
        owner: "any",
        priority: "adjust",
        triggerNsid: "card.action:base/bunker",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.bombardment.hit += 4
            }
        }
    },
    {
        // "Opponent PDS lose PLANETARY SHIELD and SPACE CANNON DEFENSE",
        isCombat: true,
        localeName: "unit_modifier.name.disable",
        localeDescription: "unit_modifier.desc.disable",
        owner: "opponent",
        priority: "mutate",
        triggerNsid: "card.action:base/disable",
        applyAll: (unitAttrsSet, auxData) => {
            const pdsAttrs = unitAttrsSet.get('pds')
            delete pdsAttrs.raw.planetaryShield
            delete pdsAttrs.raw.spaceCannon
        }
    },
    {
        // "One in or adjacent Space Dock gets SPACE CANNON 5x3",
        isCombat: true,
        localeName: "unit_modifier.name.experimental_battlestation",
        localeDescription: "unit_modifier.desc.experimental_battlestation",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.action:base/experimental_battlestation",
        applyAll: (unitAttrsSet, auxData) => {
            if (auxData.self.has('space_dock')) {
                unitAttrsSet.addSpecialUnit(new UnitAttrs({
                    unit: 'experimental_battlestation',
                    localeName: "unit_modifier.name.experimental_battlestation",
                    spaceCannon: { hit: 5, dice: 3, range: 1 }
                }))
                auxData.self.overrideCount('experimental_battlestation', 1)
            }
        }
    },
    {
        // "+1 die to a single GROUND COMBAT roll",
        isCombat: true,
        localeName: "unit_modifier.name.evelyn_delouis",
        localeDescription: "unit_modifier.desc.evelyn_delouis",
        owner: "self",
        priority: "choose",
        toggleActive: true,
        triggerNsid: "card.leader.agent.sol:pok/evelyn_delouis",
        applyAll: (unitAttrsSet, auxData) => {
            let best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.groundCombat &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.groundCombat.hit < best.raw.groundCombat.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.groundCombat.extraDice = (best.raw.groundCombat.extraDice || 0) + 1
            }
        }
    },
    {
        // "+2 to fighters' COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.fighter_prototype",
        localeDescription: "unit_modifier.desc.fighter_prototype",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.action:base/fighter_prototype",
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get('fighter')
            if (fighterAttrs.raw.spaceCombat) {
                fighterAttrs.raw.spaceCombat.hit -= 2
            }
            if (fighterAttrs.raw.groundCombat) {
                fighterAttrs.raw.groundCombat.hit -= 2
            }
        }
    },
    {
        // "-1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.fragile",
        localeDescription: "unit_modifier.desc.fragile",
        owner: "self",
        priority: "adjust",
        triggerFactionAbility: 'fragile',
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit += 1
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit += 1
            }
        }
    },
    {
        // "Produce an additional Fighter for their cost; it doesn't count towards production limits.",
        isCombat: false,
        localeName: "unit_modifier.name.maban",
        localeDescription: "unit_modifier.desc.maban",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.leader.commander.naalu:pok/maban",
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get('fighter')
            fighterAttrs.raw.produce += 1
            fighterAttrs.raw.freeProduce = (fighterAttrs.raw.freeProduce || 0) + 1
        }
    },
    {
        // "+1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.morale_boost",
        localeDescription: "unit_modifier.desc.morale_boost",
        owner: "self",
        priority: "adjust",
        triggerNsids: [
            'card.action:base/morale_boost.1',
            'card.action:base/morale_boost.2',
            'card.action:base/morale_boost.3',
            'card.action:base/morale_boost.4'
        ],
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1
            }
        }
    },
    {
        // "You can produce your flagship without spending resources.",
        isCombat: false,
        localeName: "unit_modifier.name.navarch_feng",
        localeDescription: "unit_modifier.desc.navarch_feng",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.leader.commander.nomad:pok/navarch_feng",
        applyAll: (unitAttrsSet, auxData) => {
            const flagshipAttrs = unitAttrsSet.get('flagship')
            flagshipAttrs.raw.cost = 0
        }
    },
    {
        // "+1 to SPACE COMBAT rolls (defender)",
        isCombat: true,
        localeName: "unit_modifier.name.nebula_defense",
        localeDescription: "unit_modifier.desc.nebula_defense",
        owner: "self",
        priority: "adjust",
        // TODO XXX TRIGGER??
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1
            }
        }
    },
    {
        // "+1 die to a single SPACE CANNON or BOMBARDMENT roll",
        isCombat: true,
        localeName: "unit_modifier.name.plasma_scoring",
        localeDescription: "unit_modifier.desc.plasma_scoring",
        owner: "self",
        priority: "choose",
        triggerNsid: "card.technology.red:base/plasma_scoring",
        applyAll: (unitAttrsSet, auxData) => {
            // Space cannon.
            let best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.spaceCannon &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.spaceCannon.hit < best.raw.spaceCannon.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.spaceCannon.extraDice = (best.raw.spaceCannon.extraDice || 0) + 1
            }
            // Bombardment.
            best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.bombardment &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.bombardment.hit < best.raw.bombardment.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.bombardment.extraDice = (best.raw.bombardment.extraDice || 0) + 1
            }
        }
    },
    {
        // "+1 to fighter's COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.prophecy_of_ixth",
        localeDescription: "unit_modifier.desc.prophecy_of_ixth",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.agenda:base/prophecy_of_ixth",
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get('fighter')
            if (fighterAttrs.raw.spaceCombat) {
                fighterAttrs.raw.spaceCombat.hit += 1
            }
            if (fighterAttrs.raw.groundCombat) {
                fighterAttrs.raw.groundCombat.hit += 1
            }
        }
    },
    {
        // "War Suns lose SUSTAIN DAMAGE",
        isCombat: true,
        localeName: "unit_modifier.name.publicize_weapon_schematics",
        localeDescription: "unit_modifier.desc.publicize_weapon_schematics",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.agenda:base/publicize_weapon_schematics",
        applyAll: (unitAttrsSet, auxData) => {
            const warSunAttrs = unitAttrsSet.get('war_sun')
            delete warSunAttrs.raw.sustainDamage
        }
    },
    {
        // "Fighters and infantry cost 1 each",
        isCombat: false,
        localeName: "unit_modifier.name.regulated_conscription",
        localeDescription: "unit_modifier.desc.regulated_conscription",
        owner: "any",
        priority: "adjust",
        triggerNsid: "card.agenda:base/regulated_conscription",
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get('fighter')
            const infantryAttrs = unitAttrsSet.get('infantry')
            fighterAttrs.raw.produce = 1
            infantryAttrs.raw.produce = 1
        }
    },
    {
        // "+2 to combat rolls",
        isCombat: true,
        localeName: "unit_modifier.name.rickar_rickani",
        localeDescription: "unit_modifier.desc.rickar_rickani",
        owner: "self",
        priority: "adjust",
        toggleActive: true,
        triggerNsid: "card.leader.commander.winnu:pok/rickar_rickani",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 2
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 2
            }
        }
    },
    {
        // "Copy abilities from other agents",
        isCombat: true,
        localeName: "unit_modifier.name.ssruu",
        localeDescription: "unit_modifier.desc.ssruu",
        owner: "self",
        priority: "mutate",
        toggleActive: true,
        triggerNsid: "card.leader.agent.yssaril:pok/ssruu",
        // TODO XXX
    },
    {
        // "+1 die to a unit ability (anti-fighter barrage, bombardment, space cannon)",
        isCombat: true,
        localeName: "unit_modifier.name.strike_wing_ambuscade",
        localeDescription: "unit_modifier.desc.strike_wing_ambuscade",
        owner: "self",
        priority: "choose",
        triggerNsid: "card.promissory.argent:pok/strike_wing_ambuscade",
        applyAll: (unitAttrsSet, auxData) => {
            // antiFighterBarrage.
            let best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.antiFighterBarrage &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.antiFighterBarrage.hit < best.raw.antiFighterBarrage.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.antiFighterBarrage.extraDice = (best.raw.antiFighterBarrage.extraDice || 0) + 1
            }
            // Bombardment.
            best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.bombardment &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.bombardment.hit < best.raw.bombardment.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.bombardment.extraDice = (best.raw.bombardment.extraDice || 0) + 1
            }
            // Space cannon.
            best = false
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.spaceCannon &&
                    auxData.self.has(unitAttrs.raw.unit)) {
                    if (!best || unitAttrs.raw.spaceCannon.hit < best.raw.spaceCannon.hit) {
                        best = unitAttrs
                    }
                }
            }
            if (best) {
                best.raw.spaceCannon.extraDice = (best.raw.spaceCannon.extraDice || 0) + 1
            }
        }
    },
    {
        // "+1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.supercharge",
        localeDescription: "unit_modifier.desc.supercharge",
        owner: "self",
        priority: "adjust",
        toggleActive: true,
        triggerNsid: "card.technology.red.naazrokha:pok/supercharge",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1
            }
        }
    },
    {
        // "You may reroll any ability dice (when active will reroll all misses)",
        isCombat: true,
        localeName: "unit_modifier.name.ta_zern",
        localeDescription: "unit_modifier.desc.ta_zern",
        owner: "self",
        priority: "adjust",
        toggleActive: true,
        triggerNsid: "card.leader.commander.jolnar:pok/ta_zern",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.antiFighterBarrage) {
                unitAttrs.raw.antiFighterBarrage.rerollMisses = true
            }
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.bombardment.rerollMisses = true
            }
            if (unitAttrs.raw.spaceCannon) {
                unitAttrs.raw.spaceCannon.rerollMisses = true
            }
        }
    },
    {
        // "+1 to GROUND COMBAT rolls for attacker, -1 to Sardakk if opponent owns",
        isCombat: true,
        localeName: "unit_modifier.name.tekklar_legion",
        localeDescription: "unit_modifier.desc.tekklar_legion",
        owner: "any",
        priority: "adjust",
        triggerNsid: "card.promissory.norr:base/tekklar_legion",
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.groundCombat) {
                const bonus = auxData.self.faction == 'norr' ? -1 : 1
                unitAttrs.raw.groundCombat.hit -= bonus
            }
        }
    },
    {
        // "When producing Infantry and/or Fighters, up to 2 do not count against the production limit.",
        isCombat: false,
        localeDescription: "unit_modifier.desc.that_which_molds_flesh",
        localeName: "unit_modifier.name.that_which_molds_flesh",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.leader.commander.vuilraith:pok/that_which_molds_flesh",
        applyAll: (unitAttrsSet, auxData) => {
            const infantryAttrs = unitAttrsSet.get('infantry')
            const fighterAttrs = unitAttrsSet.get('fighter')
            infantryAttrs.raw.sharedFreeProduce = (infantryAttrs.raw.freeProduce || 0) + 2
            fighterAttrs.raw.sharedFreeProduce = (infantryAttrs.raw.freeProduce || 0) + 2
        }
    },
    {
        // "One non-fighter ship gains the SUSTAIN DAMAGE, combat value, and ANTI-FIGHTER BARRAGE of the Nomad flagship (this modifier adds a new unit for AFB/space combat, remove the affected unit from normal setup)",
        isCombat: true,
        localeName: "unit_modifier.name.the_cavalry",
        localeDescription: "unit_modifier.desc.the_cavalry",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.promissory.nomad:pok/the_cavalry",
        applyAll: (unitAttrsSet, auxData) => {
            let rawCavalryAttrs = {
                unit: 'the_cavalry',
                localeName: 'unit_modifier.name.the_cavalry',
                antiFighterBarrage: { hit: 8, dice: 3 },
                spaceCombat: { hit: 7, dice: 2 },
            }
            const cavalry2nsid = 'card.technology.unit_upgrade.nomad:pok/memoria_2'
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj)
                if (nsid === cavalry2nsid && obj.isFaceUp && obj.isFaceUp()) {
                    rawCavalryAttrs.antiFighterBarrage.hit = 5
                    rawCavalryAttrs.spaceCombat.hit = 5
                    break
                }
            }
            unitAttrsSet.addSpecialUnit(new UnitAttrs(rawCavalryAttrs))
            auxData.self.overrideCount('the_cavalry', 1)
        }
    },
    {
        // "Apply +1 to COMBAT rolls, player must destroy any units that do not produce at least one hit",
        isCombat: true,
        localeName: "unit_modifier.name.the_crown_of_thalnos",
        localeDescription: "unit_modifier.desc.the_crown_of_thalnos",
        owner: "self",
        priority: "adjust",
        toggleActive: true,
        triggerNsid: "card.agenda:base.only/the_crown_of_thalnos",
        // TODO XXX
    },
    {
        // "+1 die to a unit ability (anti-fighter barrage, bombardment, space cannon)",
        isCombat: true,
        localeName: "unit_modifier.name.trrakan_aun_zulok",
        localeDescription: "unit_modifier.desc.trrakan_aun_zulok",
        owner: "self",
        priority: "choose",
        toggleActive: true,
        triggerNsid: "card.leader.commander.argent:pok/trrakan_aun_zulok",
        // TODO XXX
    },
    {
        // "SPACE CANNON 5(x3)",
        isCombat: true,
        localeName: "unit_modifier.name.ul_the_progenitor",
        localeDescription: "unit_modifier.desc.ul_the_progenitor",
        owner: "self",
        priority: "mutate",
        toggleActive: true,
        triggerNsid: "card.leader.hero.ul:pok/ul_the_progenitor",
        applyAll: (unitAttrsSet, auxData) => {
            if (auxData.self.has('space_dock')) {
                unitAttrsSet.addSpecialUnit(new UnitAttrs({
                    unit: 'ul_the_progenitor',
                    localeName: "unit_modifier.name.ul_the_progenitor",
                    spaceCannon: { hit: 5, dice: 3 }
                }))
                auxData.self.count('ul_the_progenitor', 1)
            }
        }
    },
    {
        // "+1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.unrelenting",
        localeDescription: "unit_modifier.desc.unrelenting",
        owner: "self",
        priority: "adjust",
        // TODO XXX FACTION ABILITY
        // TODO XXX
    },
    {
        // "+1 die to a single SPACE COMBAT roll",
        isCombat: true,
        localeName: "unit_modifier.name.viscount_unlenn",
        localeDescription: "unit_modifier.desc.viscount_unlenn",
        owner: "self",
        priority: "choose",
        toggleActive: true,
        triggerNsid: "card.leader.agent.letnev:pok/viscount_unlenn",
        // TODO XXX
    },
]