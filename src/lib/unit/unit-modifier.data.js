const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { UnitAttrs } = require("./unit-attrs");
const { world } = require("../../wrapper/api");

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
        filter: (auxData) => {
            auxData.rollType === "bombardment";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.disablePlanetaryShield = true;
            }
        },
    },
    {
        // Does not count against capacity when with a ship with capacity
        isCombat: false,
        localeName: "unit.mech.aerie_sentinel",
        localeDescription: "unit_modifier.desc.aerie_sentinel",
        owner: "self",
        priority: "mutate",
        triggerUnitAbility: "unit.mech.aerie_sentinel",
        applyAll: (unitAttrsSet, auxData) => {
            let hasCapacity = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.capacity) {
                    hasCapacity = true;
                    break;
                }
            }
            if (hasCapacity) {
                const mechAttrs = unitAttrsSet.get("mech");
                delete mechAttrs.raw.requireCapacity;
            }
        },
    },
    {
        // "-1 to all SPACE CANNON rolls",
        isCombat: true,
        localeName: "unit_modifier.name.antimass_deflectors",
        localeDescription: "unit_modifier.desc.antimass_deflectors",
        owner: "opponent",
        priority: "adjust",
        triggerNsid: "card.technology.blue:base/antimass_deflectors",
        filter: (auxData) => {
            return auxData.rollType === "spaceCannon";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCannon) {
                unitAttrs.raw.spaceCannon.hit += 1;
            }
        },
    },
    {
        // +2 flagship COMBAT against opponent with no token in your fleet pool
        isCombat: true,
        localeName: "unit.flagship.arvicon_rex",
        localeDescription: "unit_modifier.desc.arvicon_rex",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.arvicon_rex",
        filter: (auxData) => {
            if (!auxData.self.has("flagship")) {
                return false;
            }
            // Find own command sheet and opponent command tokens.
            const selfSlot = auxData.self.playerSlot;
            const opptSlot = auxData.opponent.playerSlot;
            let selfSheet = false;
            const opponentCommandTokens = [];
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                const owner = obj.getOwningPlayerSlot();
                if (nsid === "sheet:base/command" && owner === selfSlot) {
                    selfSheet = obj;
                }
                if (ObjectNamespace.isCommandToken(obj) && owner === opptSlot) {
                    opponentCommandTokens.push(obj);
                }
            }
            if (!selfSheet) {
                return false;
            }
            for (const opponentCommandToken in opponentCommandTokens) {
                const worldPos = opponentCommandToken.getPosition();
                const sheetPos = selfSheet.worldPositionToLocal(worldPos);
                // 15 is somewhat generous but nowhere near map area.
                if (sheetPos.magnitudeSquared() < 225) {
                    return true;
                }
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            const flagshipAttrs = unitAttrsSet.get("flagship");
            if (flagshipAttrs.raw.spaceCombat) {
                flagshipAttrs.raw.spaceCombat.hit -= 2;
            }
            if (flagshipAttrs.raw.groundCombat) {
                flagshipAttrs.raw.groundCombat.hit -= 2;
            }
        },
    },
    {
        // "Mechs lose non-SUSTAIN DAMAGE abilities",
        isCombat: true,
        localeName: "unit_modifier.name.articles_of_war",
        localeDescription: "unit_modifier.desc.articles_of_war",
        owner: "any",
        priority: "mutate",
        triggerNsid: "card.agenda:pok/articles_of_war",
        filter: (auxData) => {
            return auxData.self.has("mech");
        },
        applyAll: (unitAttrsSet, auxData) => {
            const mechAttrs = unitAttrsSet.get("mech");
            delete mechAttrs.raw.antiFighterBarrage;
            delete mechAttrs.raw.bombardment;
            delete mechAttrs.raw.planetaryShield;
            delete mechAttrs.raw.production;
            delete mechAttrs.raw.spaceCannon;
        },
    },
    {
        // "BOMBARDMENT 6 to non-fighter, non-bomdbardment ships",
        isCombat: true,
        localeName: "unit_modifier.name.blitz",
        localeDescription: "unit_modifier.desc.blitz",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.action:codex.ordinian/blitz",
        filter: (auxData) => {
            return auxData.rollType === "bombardment";
        },
        applyEach: (unitAttrs, auxData) => {
            if (
                unitAttrs.raw.ship &&
                unitAttrs.raw.unit !== "fighter" &&
                !unitAttrs.raw.bombardment
            ) {
                unitAttrs.raw.bombardment = { dice: 1, hit: 6 };
            }
        },
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
            const infantryAttrs = unitAttrsSet.get("infantry");
            infantryAttrs.raw.produce += 1;
            infantryAttrs.raw.freeProduce =
                (infantryAttrs.raw.freeProduce || 0) + 1;
        },
    },
    {
        // "-4 to all BOMBARDMENT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.bunker",
        localeDescription: "unit_modifier.desc.bunker",
        owner: "any",
        priority: "adjust",
        triggerNsid: "card.action:base/bunker",
        filter: (auxData) => {
            return auxData.rollType === "bombardment";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.bombardment.hit += 4;
            }
        },
    },
    {
        // +1 to all COMBAT rolls for other ships with the C'morran N'orr
        isCombat: true,
        localeName: "unit.flagship.cmorran_norr",
        localeDescription: "unit_modifier.desc.cmorran_norr",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.cmorran_norr",
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" &&
                auxData.self.has("flagship")
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (
                unitAttrs.raw.ship &&
                unitAttrs.raw.unit !== "flagship" &&
                unitAttrs.raw.spaceCombat
            ) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
        },
    },
    {
        // Players cannot use BOMBARDMENT against units that are on cultural planets
        isCombat: true,
        localeName: "unit_modifier.name.conventions_of_war",
        localeDescription: "unit_modifier.desc.conventions_of_war",
        owner: "any",
        priority: "mutate",
        triggerNsid: "card.agenda:base/conventions_of_war",
        filter: (auxData) => {
            if (auxData.rollType !== "bombardment") {
                return false;
            }
            const planet = auxData.self.planet;
            return planet && planet.traits.includes("cultural");
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.bombardment) {
                delete unitAttrs.raw.bombardment;
            }
        },
    },
    {
        // "Opponent PDS lose PLANETARY SHIELD and SPACE CANNON DEFENSE",
        isCombat: true,
        localeName: "unit_modifier.name.disable",
        localeDescription: "unit_modifier.desc.disable",
        owner: "opponent",
        priority: "mutate",
        triggerNsid: "card.action:base/disable",
        filter: (auxData) => {
            if (!auxData.self.has("pds")) {
                return false;
            }
            if (auxData.rollType === "bombardment") {
                return true;
            }
            if (auxData.rollType === "spaceCannon" && auxData.planet) {
                return true; // planet means space cannon defense
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            const pdsAttrs = unitAttrsSet.get("pds");
            delete pdsAttrs.raw.planetaryShield;
            delete pdsAttrs.raw.spaceCannon;
        },
    },
    {
        // Count as ship when off planet.
        isCombat: true,
        localeName: "unit.mech.eidolon",
        localeDescription: "unit_modifier.desc.eidolon",
        owner: "self",
        priority: "mutate",
        triggerUnitAbility: "unit.mech.eidolon",
        filter: (auxData) => {
            return (
                auxData.self.has("mech") &&
                (auxData.rollType === "spaceCombat" ||
                    auxData.rollType === "groundCombat")
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            let spaceCount = 0;
            let groundCount = 0;
            for (const unitPlastic of auxData.self.plastic) {
                if (unitPlastic.exactPlanet) {
                    groundCount += 1;
                } else {
                    spaceCount += 1;
                }
            }
            if (auxData.rollType === "spaceCombat" && spaceCount > 0) {
                const mechAttrs = unitAttrsSet.get("mech");
                mechAttrs.raw.ship = true;
                auxData.self.overrideCount("mech", spaceCount);
            }
            if (auxData.rollType === "groundCombat" && spaceCount > 0) {
                auxData.self.overrideCount("mech", groundCount);
            }
        },
    },
    {
        // "One in or adjacent Space Dock gets SPACE CANNON 5x3",
        isCombat: true,
        localeName: "unit_modifier.name.experimental_battlestation",
        localeDescription: "unit_modifier.desc.experimental_battlestation",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.action:base/experimental_battlestation",
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCannon" &&
                !auxData.planet &&
                (auxData.self.has("space_dock") ||
                    auxData.hasAdjacent("space_dock"))
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            if (auxData.self.has("space_dock")) {
                unitAttrsSet.addSpecialUnit(
                    new UnitAttrs({
                        unit: "experimental_battlestation",
                        localeName:
                            "unit_modifier.name.experimental_battlestation",
                        spaceCannon: { hit: 5, dice: 3, range: 1 },
                    })
                );
                auxData.self.overrideCount("experimental_battlestation", 1);
            }
        },
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
        filter: (auxData) => {
            return auxData.rollType === "groundCombat";
        },
        applyAll: (unitAttrsSet, auxData) => {
            let best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.groundCombat &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.groundCombat.hit <
                            best.raw.groundCombat.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.groundCombat.extraDice =
                    (best.raw.groundCombat.extraDice || 0) + 1;
            }
        },
    },
    {
        // "+2 to fighters' COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.fighter_prototype",
        localeDescription: "unit_modifier.desc.fighter_prototype",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.action:base/fighter_prototype",
        filter: (auxData) => {
            const fighterAttrs = auxData.self.unitAttrsSet.get("fighter");
            if (auxData.rollType === "groundCombat") {
                return fighterAttrs.raw.groundCombat;
            } else if (auxData.rollType === "spaceCombat") {
                return fighterAttrs.raw.spaceCombat;
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get("fighter");
            if (fighterAttrs.raw.spaceCombat) {
                fighterAttrs.raw.spaceCombat.hit -= 2;
            }
            if (fighterAttrs.raw.groundCombat) {
                fighterAttrs.raw.groundCombat.hit -= 2;
            }
        },
    },
    {
        // Opponent's ships cannot use SUSTAIN DAMAGE
        isCombat: true,
        localeName: "unit.flagship.fourth_moon",
        localeDescription: "unit_modifier.desc.fourth_moon",
        owner: "opponent",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.fourth_moon",
        filter: (auxData) => {
            return auxData.opponent.has("flagship");
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.ship && unitAttrs.raw.sustainDamage) {
                unitAttrs.raw.sustainDamage = false;
            }
        },
    },
    {
        // "-1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.fragile",
        localeDescription: "unit_modifier.desc.fragile",
        owner: "self",
        priority: "adjust",
        triggerFactionAbility: "fragile",
        filter: (auxData) => {
            auxData.rollType === "spaceCombat" &&
                auxData.rollType === "groundCombat";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit += 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit += 1;
            }
        },
    },
    {
        // "+2 mech COMBAT rolls if opponent has fragment",
        isCombat: true,
        localeName: "unit.mech.iconoclast",
        localeDescription: "unit_modifier.desc.iconoclast",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.mech.iconoclast",
        filter: (auxData) => {
            if (
                auxData.rollType !== "spaceCombat" &&
                auxData.rollType !== "groundCombat"
            ) {
                return false; // not COMBAT
            }
            if (!auxData.has("mech")) {
                return false; // no mech
            }
            for (const obj of world.getAllObjects()) {
                if (!CardUtil.isLooseCard(obj)) {
                    continue;
                }
                const nsid = ObjectNamespace.getNsid(obj);
                if (!nsid.startsWith("card.exploration")) {
                    continue;
                }
                if (!nsid.includes("_relic_fragment")) {
                    continue;
                }
                const owner = world.TI4.getClosestPlayerDesk(obj.getPosition());
                if (owner === auxData.playerSlot) {
                    return true;
                }
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            const mechAttrs = unitAttrsSet.get("mech");
            if (mechAttrs.raw.spaceCombat) {
                mechAttrs.raw.spaceCombat.hit -= 2;
            }
            if (mechAttrs.raw.groundCombat) {
                mechAttrs.raw.groundCombat.hit -= 2;
            }
        },
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
            const fighterAttrs = unitAttrsSet.get("fighter");
            fighterAttrs.raw.produce += 1;
            fighterAttrs.raw.freeProduce =
                (fighterAttrs.raw.freeProduce || 0) + 1;
        },
    },
    {
        // Fighters may participate in ground combat
        isCombat: true,
        localeName: "unit.flagship.matriarch",
        localeDescription: "unit_modifier.desc.matriarch",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.matriarch",
        filter: (auxData) => {
            return (
                auxData.has("fighter") && auxData.rollType === "groundCombat"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (
                unitAttrs.raw.unit === "fighter" &&
                !unitAttrs.raw.groundCombat
            ) {
                unitAttrs.raw.groundCombat = {
                    dice: unitAttrs.raw.spaceCombat.dice,
                    hit: unitAttrs.raw.spaceCombat.hit,
                    anyPlanet: true,
                };
            }
        },
    },
    {
        // Other's ground forces on planet cannot SUSTAIN DAMAGE
        isCombat: true,
        localeName: "unit.mech.moll_terminus",
        localeDescription: "unit_modifier.desc.moll_terminus",
        owner: "opponent",
        priority: "mutate",
        triggerUnitAbility: "unit.mech.moll_terminus",
        filter: (auxData) => {
            return auxData.rollType === "groundCombat";
        },
        applyEach: (unitAttrs, auxData) => {
            if (
                unitAttrs.raw.ground &&
                unitAttrs.raw.sustainDamage &&
                auxData.opponent.has("mech")
            ) {
                delete unitAttrs.raw.sustainDamage;
            }
        },
    },
    {
        // "+1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.morale_boost",
        localeDescription: "unit_modifier.desc.morale_boost",
        owner: "self",
        priority: "adjust",
        triggerNsids: [
            "card.action:base/morale_boost.1",
            "card.action:base/morale_boost.2",
            "card.action:base/morale_boost.3",
            "card.action:base/morale_boost.4",
        ],
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" ||
                auxData.rollType === "groundCombat"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1;
            }
        },
    },
    {
        // +2 mech COMBAT rolls if opponent has X/Y token
        isCombat: true,
        localeName: "unit.mech.mordred",
        localeDescription: "unit_modifier.desc.mordred",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.mech.mordred",
        filter: (auxData) => {
            if (
                auxData.rollType !== "spaceCombat" &&
                auxData.rollType !== "groundCombat"
            ) {
                return false; // not COMBAT
            }
            if (!auxData.has("mech")) {
                return false; // no mech
            }
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid.startsWith("token.nekro:base/valefar_assimilator")) {
                    const tokenPos = obj.getPosition();
                    const closest = world.TI4.getClosestPlayerDesk(tokenPos);
                    if (closest.playerSlot == auxData.opponent.playerSlot) {
                        return true;
                    }
                }
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            const mechAttrs = unitAttrsSet.get("mech");
            if (mechAttrs.raw.spaceCombat) {
                mechAttrs.raw.spaceCombat.hit -= 2;
            }
            if (mechAttrs.raw.groundCombat) {
                mechAttrs.raw.groundCombat.hit -= 2;
            }
        },
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
            const flagshipAttrs = unitAttrsSet.get("flagship");
            flagshipAttrs.raw.cost = 0;
        },
    },
    {
        // "+1 to SPACE COMBAT rolls (defender)",
        isCombat: true,
        localeName: "unit_modifier.name.nebula_defense",
        localeDescription: "unit_modifier.desc.nebula_defense",
        owner: "self",
        priority: "adjust",
        triggerNsid: "token:base/nebula_defense",
        triggerIf: (auxData) => {
            const isDefender =
                auxData.self.playerSlot !== auxData.self.activatingPlayerSlot;
            const isNebula =
                auxData.self.activeSystem &&
                auxData.self.activeSystem.anomalies.includes("nebula");
            return isDefender && isNebula;
        },
        filter: (auxData) => {
            return auxData.rollType === "spaceCombat";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
        },
    },
    {
        // "+1 die to a single SPACE CANNON or BOMBARDMENT roll",
        isCombat: true,
        localeName: "unit_modifier.name.plasma_scoring",
        localeDescription: "unit_modifier.desc.plasma_scoring",
        owner: "self",
        priority: "choose",
        triggerNsid: "card.technology.red:base/plasma_scoring",
        filter: (auxData) => {
            console.log(`rollType=${auxData.rollType}`);
            if (auxData.rollType === "spaceCannon") {
                return true;
            } else if (auxData.rollType === "bombardment") {
                // If a first planet is specified, only apply to first.
                const isFirst = auxData.isFirstBombardmentPlanet;
                console.log(`isFirst=${isFirst}`);
                return isFirst === undefined || isFirst;
            }
        },
        applyAll: (unitAttrsSet, auxData) => {
            // Space cannon.
            let best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                // Consider adjacent units if they have range.
                let has = auxData.self.has(unitAttrs.raw.unit);
                if (!has && auxData.self.hasAdjacent(unitAttrs.raw.unit)) {
                    has =
                        unitAttrs.raw.spaceCannon.range &&
                        unitAttrs.raw.spaceCannon.range > 0;
                }
                if (unitAttrs.raw.spaceCannon && has) {
                    if (
                        !best ||
                        unitAttrs.raw.spaceCannon.hit < best.raw.spaceCannon.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.spaceCannon.extraDice =
                    (best.raw.spaceCannon.extraDice || 0) + 1;
            }
            // Bombardment.
            best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.bombardment &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.bombardment.hit < best.raw.bombardment.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.bombardment.extraDice =
                    (best.raw.bombardment.extraDice || 0) + 1;
            }
        },
    },
    {
        // "+1 to fighter's COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.prophecy_of_ixth",
        localeDescription: "unit_modifier.desc.prophecy_of_ixth",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.agenda:base/prophecy_of_ixth",
        filter: (auxData) => {
            return (
                auxData.has("fighter") &&
                (auxData.rollType === "spaceCombat" ||
                    auxData.rollType === "groundCombat")
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            const fighterAttrs = unitAttrsSet.get("fighter");
            if (fighterAttrs.raw.spaceCombat) {
                fighterAttrs.raw.spaceCombat.hit += 1;
            }
            if (fighterAttrs.raw.groundCombat) {
                fighterAttrs.raw.groundCombat.hit += 1;
            }
        },
    },
    {
        // "War Suns lose SUSTAIN DAMAGE",
        isCombat: true,
        localeName: "unit_modifier.name.publicize_weapon_schematics",
        localeDescription: "unit_modifier.desc.publicize_weapon_schematics",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.agenda:base/publicize_weapon_schematics",
        filter: (auxData) => {
            return (
                auxData.self.has("war_sun") || auxData.opponent.has("war_sun")
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            const warSunAttrs = unitAttrsSet.get("war_sun");
            delete warSunAttrs.raw.sustainDamage;
        },
    },
    {
        // Other players cannot use SPACE CANNON against your ships in this system
        isCombat: true,
        localeName: "unit.flagship.quetzecoatl",
        localeDescription: "unit_modifier.desc.quetzecoatl",
        owner: "opponent",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.quetzecoatl",
        filter: (auxData) => {
            return auxData.rollType === "spaceCannon" && !auxData.activePlanet;
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCannon) {
                delete unitAttrs.raw.spaceCannon;
            }
        },
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
            const fighterAttrs = unitAttrsSet.get("fighter");
            const infantryAttrs = unitAttrsSet.get("infantry");
            fighterAttrs.raw.produce = 1;
            infantryAttrs.raw.produce = 1;
        },
    },
    {
        // "+2 to combat rolls (Mecatol, home, or legendary)",
        isCombat: true,
        localeName: "unit_modifier.name.rickar_rickani",
        localeDescription: "unit_modifier.desc.rickar_rickani",
        owner: "self",
        priority: "adjust",
        triggerNsid: "card.leader.commander.winnu:pok/rickar_rickani",
        filter: (auxData) => {
            const system = auxData.self.activeSystem;
            if (system) {
                if (system.tile === 18) {
                    return true; // Mecatol
                }
                for (const planet of system.planets) {
                    if (planet.raw.legendary) {
                        return true; // legendary
                    }
                }
                const faction = auxData.self.faction;
                return faction && faction.home == system.tile;
            }
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 2;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 2;
            }
        },
    },
    {
        // Rolls number of dice equal to number of opponent's non-fighter ships
        isCombat: true,
        localeName: "unit.flagship.salai_sai_corian",
        localeDescription: "unit_modifier.desc.salai_sai_corian",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.salai_sai_corian",
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" &&
                auxData.self.has("flagship")
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            let nonFighterShipCount = 0;
            for (const unitAttrs of auxData.opponent.unitAttrsSet.values()) {
                if (unitAttrs.raw.ship && unitAttrs.raw.unit !== "fighter") {
                    nonFighterShipCount += auxData.opponent.count(
                        unitAttrs.raw.unit
                    );
                }
            }
            const flagshipAttrs = unitAttrsSet.get("flagship");
            if (flagshipAttrs.raw.spaceCombat) {
                flagshipAttrs.raw.spaceCombat.dice = nonFighterShipCount;
            }
        },
    },
    {
        // Infantry on planet with mech are not FRAGILE
        isCombat: true,
        localeName: "unit.mech.shield_paling",
        localeDescription: "unit_modifier.desc.shield_paling",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.mech.shield_paling",
        filter: (auxData) => {
            return auxData.has("mech") && auxData.has("infantry");
        },
        applyAll: (unitAttrsSet, auxData) => {
            // Normally mech is paired with Jol-Nar + FRAGILE, but watch out for Franken!
            let hasFragile = false;
            for (const unitModifier of auxData.self.unitModifiers) {
                if (
                    unitModifier.raw.localeName == "unit_modifier.name.fragile"
                ) {
                    hasFragile = true;
                    break;
                }
            }
            // Do not attempt to suppress "fragile" application, just undo it.
            const infantryAttrs = unitAttrsSet.get("infantry");
            if (
                hasFragile &&
                auxData.self.has("mech") &&
                infantryAttrs.raw.groundCombat
            ) {
                infantryAttrs.raw.groundCombat -= 1;
            }
        },
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
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCannon" ||
                auxData.rollType === "antiFighterBarrage" ||
                auxData.rollType === "bombardment"
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            // antiFighterBarrage.
            let best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.antiFighterBarrage &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.antiFighterBarrage.hit <
                            best.raw.antiFighterBarrage.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.antiFighterBarrage.extraDice =
                    (best.raw.antiFighterBarrage.extraDice || 0) + 1;
            }
            // Bombardment.
            best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.bombardment &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.bombardment.hit < best.raw.bombardment.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.bombardment.extraDice =
                    (best.raw.bombardment.extraDice || 0) + 1;
            }
            // Space cannon.
            best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                let has = auxData.self.has(unitAttrs.raw.unit);
                if (!has && auxData.self.hasAdjacent(unitAttrs.raw.unit)) {
                    has =
                        unitAttrs.raw.spaceCannon.range &&
                        unitAttrs.raw.spaceCannon.range > 0;
                }
                if (unitAttrs.raw.spaceCannon && has) {
                    if (
                        !best ||
                        unitAttrs.raw.spaceCannon.hit < best.raw.spaceCannon.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.spaceCannon.extraDice =
                    (best.raw.spaceCannon.extraDice || 0) + 1;
            }
        },
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
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" ||
                auxData.rollType === "groundCombat"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1;
            }
        },
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
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCannon" ||
                auxData.rollType === "antiFighterBarrage" ||
                auxData.rollType === "bombardment"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.antiFighterBarrage) {
                unitAttrs.raw.antiFighterBarrage.rerollMisses = true;
            }
            if (unitAttrs.raw.bombardment) {
                unitAttrs.raw.bombardment.rerollMisses = true;
            }
            if (unitAttrs.raw.spaceCannon) {
                unitAttrs.raw.spaceCannon.rerollMisses = true;
            }
        },
    },
    {
        // "+1 to GROUND COMBAT rolls for attacker, -1 to Sardakk if opponent owns",
        isCombat: true,
        localeName: "unit_modifier.name.tekklar_legion",
        localeDescription: "unit_modifier.desc.tekklar_legion",
        owner: "any",
        priority: "adjust",
        triggerNsid: "card.promissory.norr:base/tekklar_legion",
        filter: (auxData) => {
            return auxData.rollType === "groundCombat";
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.groundCombat) {
                const bonus = auxData.self.faction == "norr" ? -1 : 1;
                unitAttrs.raw.groundCombat.hit -= bonus;
            }
        },
    },
    {
        // "When producing Infantry and/or Fighters, up to 2 do not count against the production limit.",
        isCombat: false,
        localeDescription: "unit_modifier.desc.that_which_molds_flesh",
        localeName: "unit_modifier.name.that_which_molds_flesh",
        owner: "self",
        priority: "adjust",
        triggerNsid:
            "card.leader.commander.vuilraith:pok/that_which_molds_flesh",
        applyAll: (unitAttrsSet, auxData) => {
            const infantryAttrs = unitAttrsSet.get("infantry");
            const fighterAttrs = unitAttrsSet.get("fighter");
            infantryAttrs.raw.sharedFreeProduce =
                (infantryAttrs.raw.freeProduce || 0) + 2;
            fighterAttrs.raw.sharedFreeProduce =
                (infantryAttrs.raw.freeProduce || 0) + 2;
        },
    },
    {
        // Ground forces may participate in space combat
        isCombat: true,
        localeName: "unit.flagship.the_alastor",
        localeDescription: "unit_modifier.desc.the_alastor",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.the_alastor",
        filter: (auxData) => {
            return auxData.rollType === "spaceCombat";
        },
        applyEach: (unitAttrs, auxData) => {
            if (
                unitAttrs.raw.ground &&
                unitAttrs.raw.groundCombat &&
                !unitAttrs.raw.spaceCombat
            ) {
                unitAttrs.raw.spaceCombat = {
                    dice: unitAttrs.raw.groundCombat.dice,
                    hit: unitAttrs.raw.groundCombat.hit,
                };
            }
        },
    },
    {
        // "One non-fighter ship gains the SUSTAIN DAMAGE, combat value, and ANTI-FIGHTER BARRAGE of the Nomad flagship (this modifier adds a new unit for AFB/space combat, remove the affected unit from normal setup)",
        isCombat: true,
        localeName: "unit_modifier.name.the_cavalry",
        localeDescription: "unit_modifier.desc.the_cavalry",
        owner: "self",
        priority: "mutate",
        triggerNsid: "card.promissory.nomad:pok/the_cavalry",
        filter: (auxData) => {
            return (
                auxData.rollType === "antiFighterBarrage" ||
                auxData.rollType === "spaceCombat"
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            let rawCavalryAttrs = {
                unit: "the_cavalry",
                localeName: "unit_modifier.name.the_cavalry",
                antiFighterBarrage: { hit: 8, dice: 3 },
                spaceCombat: { hit: 7, dice: 2 },
            };
            const cavalry2nsid =
                "card.technology.unit_upgrade.nomad:pok/memoria_2";
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === cavalry2nsid && obj.isFaceUp && obj.isFaceUp()) {
                    rawCavalryAttrs.antiFighterBarrage.hit = 5;
                    rawCavalryAttrs.spaceCombat.hit = 5;
                    break;
                }
            }
            unitAttrsSet.addSpecialUnit(new UnitAttrs(rawCavalryAttrs));
            auxData.self.overrideCount("the_cavalry", 1);
        },
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
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" ||
                auxData.rollType === "groundCombat"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1;
            }
        },
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
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCannon" ||
                auxData.rollType === "antiFighterBarrage" ||
                auxData.rollType === "bombardment"
            );
        },
        applyAll: (unitAttrsSet, auxData) => {
            // antiFighterBarrage.
            let best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.antiFighterBarrage &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.antiFighterBarrage.hit <
                            best.raw.antiFighterBarrage.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.antiFighterBarrage.extraDice =
                    (best.raw.antiFighterBarrage.extraDice || 0) + 1;
            }
            // Bombardment.
            best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.bombardment &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.bombardment.hit < best.raw.bombardment.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.bombardment.extraDice =
                    (best.raw.bombardment.extraDice || 0) + 1;
            }
            // Space cannon.
            best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                let has = auxData.self.has(unitAttrs.raw.unit);
                if (!has && auxData.self.hasAdjacent(unitAttrs.raw.unit)) {
                    has =
                        unitAttrs.raw.spaceCannon.range &&
                        unitAttrs.raw.spaceCannon.range > 0;
                }
                if (unitAttrs.raw.spaceCannon && has) {
                    if (
                        !best ||
                        unitAttrs.raw.spaceCannon.hit < best.raw.spaceCannon.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.spaceCannon.extraDice =
                    (best.raw.spaceCannon.extraDice || 0) + 1;
            }
        },
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
        filter: (auxData) => {
            return auxData.rollType === "spaceCannon";
        },
        applyAll: (unitAttrsSet, auxData) => {
            if (auxData.self.has("space_dock")) {
                unitAttrsSet.addSpecialUnit(
                    new UnitAttrs({
                        unit: "ul_the_progenitor",
                        localeName: "unit_modifier.name.ul_the_progenitor",
                        spaceCannon: { hit: 5, dice: 3 },
                    })
                );
                auxData.self.count("ul_the_progenitor", 1);
            }
        },
    },
    {
        // "+1 to all COMBAT rolls",
        isCombat: true,
        localeName: "unit_modifier.name.unrelenting",
        localeDescription: "unit_modifier.desc.unrelenting",
        owner: "self",
        priority: "adjust",
        triggerFactionAbility: "unrelenting",
        filter: (auxData) => {
            return (
                auxData.rollType === "spaceCombat" ||
                auxData.rollType === "groundCombat"
            );
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1;
            }
        },
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
        filter: (auxData) => {
            return auxData.rollType === "spaceCombat";
        },
        applyAll: (unitAttrsSet, auxData) => {
            let best = false;
            for (const unitAttrs of unitAttrsSet.values()) {
                if (
                    unitAttrs.raw.spaceCombat &&
                    auxData.self.has(unitAttrs.raw.unit)
                ) {
                    if (
                        !best ||
                        unitAttrs.raw.spaceCombat.hit < best.raw.spaceCombat.hit
                    ) {
                        best = unitAttrs;
                    }
                }
            }
            if (best) {
                best.raw.spaceCombat.extraDice =
                    (best.raw.spaceCombat.extraDice || 0) + 1;
            }
        },
    },
    {
        // Your mechs in this system roll 1 additional die during combat
        isCombat: true,
        localeName: "unit.flagship.visz_el_vir",
        localeDescription: "unit_modifier.desc.visz_el_vir",
        owner: "self",
        priority: "adjust",
        triggerUnitAbility: "unit.flagship.visz_el_vir",
        filter: (auxData) => {
            return auxData.self.has("mech");
        },
        applyEach: (unitAttrs, auxData) => {
            if (unitAttrs.raw.unit === "mech" && unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.extraDice =
                    (unitAttrs.raw.groundCombat.extraDice || 0) + 1;
            }
        },
    },
];
