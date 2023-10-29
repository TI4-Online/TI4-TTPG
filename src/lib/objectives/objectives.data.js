const { ObjectivesGoalSuccess } = require("./objectives-goal-success");

/**
 * Function returns an array from desk index to simple progress string.
 *
 * Object.{header:string,values:Array.{value:string|number,success:boolean}}}
 */
const NSID_OBJECTIVE_PROGRESS = {
    "card.objective.public_1:pok/amass_wealth": () => {
        // Spend 3 inf, 3 res, 3 tgs
        return ObjectivesGoalSuccess.checkInfResTgs(3);
    },

    "card.objective.public_1:pok/build_defenses": () => {
        // 4 structures
        return ObjectivesGoalSuccess.checkStructures(4);
    },

    "card.objective.public_1:base/corner_the_market": () => {
        // 4 planets same trait
        return ObjectivesGoalSuccess.checkPlanetsSameTrait(4);
    },

    "card.objective.public_1:base/develop_weaponry": () => {
        // 2 unit upgrades
        return ObjectivesGoalSuccess.checkUnitUpgrades(2);
    },

    "card.objective.public_1:pok/discover_lost_outposts": () => {
        // 2 planets with attachments
        return ObjectivesGoalSuccess.checkPlanetsWithAttachments(2);
    },

    "card.objective.public_1:base/diversify_research": () => {
        // 2 tech in 2 colors
        return ObjectivesGoalSuccess.checkTwoTechInColors(2);
    },

    "card.objective.public_1:pok/engineer_a_marvel": () => {
        // Flagship or war sun
        return ObjectivesGoalSuccess.checkFlagshipOrWarSun(1);
    },

    "card.objective.public_1:base/erect_a_monument": () => {
        // 8 resources
        return ObjectivesGoalSuccess.checkResources(8);
    },

    "card.objective.public_1:base/expand_borders": () => {
        // 6 planets non-home
        return ObjectivesGoalSuccess.checkPlanetsNonHome(6);
    },

    "card.objective.public_1:pok/explore_deep_space": () => {
        // 3 empty systems
        return ObjectivesGoalSuccess.checkSystemsWithoutPlanetsWithUnits(3);
    },

    "card.objective.public_1:base/found_research_outposts": () => {
        // 3 planets with tech
        return ObjectivesGoalSuccess.checkPlanetsWithTechSpecialties(3);
    },

    "card.objective.public_1:pok/improve_infrastructure": () => {
        // 3 planets with structures outside own home
        return ObjectivesGoalSuccess.checkPlanetsWithStructuresOutsidePlayersHome(
            3
        );
    },

    "card.objective.public_1:base/intimidate_council": () => {
        // 2 systems with ships adj to mecatol
        return ObjectivesGoalSuccess.checkSystemsWithShipsAdjToMecatol(2);
    },

    "card.objective.public_1:base/lead_from_the_front": () => {
        // 3 tokens from tactics/strategy
        return ObjectivesGoalSuccess.checkTokensInTacticAndStrategy(3);
    },

    "card.objective.public_1:pok/make_history": () => {
        // 3 systems with legendary, mecatol, or anomaly
        return ObjectivesGoalSuccess.checkSystemsWithUnitsInLegendaryMecatolOrAnomaly(
            3
        );
    },

    "card.objective.public_1:base/negotiate_trade_routes": () => {
        // 5 tradegoods
        return ObjectivesGoalSuccess.checkTradegoods(5);
    },

    "card.objective.public_1:pok/populate_the_outer_rim": () => {
        // 3 systems with units on edge
        return ObjectivesGoalSuccess.countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome(
            3
        );
    },

    "card.objective.public_1:pok/push_boundaries": () => {
        // More planets than 2 neighbors
        return ObjectivesGoalSuccess.checkMorePlanetsThan2Neighbors();
    },

    "card.objective.public_1:pok/raise_a_fleet": () => {
        // 1 system with 5 non-fighter ships
        return ObjectivesGoalSuccess.checkMaxNonFighterShipsInSingleSystem(5);
    },

    "card.objective.public_1:base/sway_the_council": () => {
        // 8 influence
        return ObjectivesGoalSuccess.checkInfluence(8);
    },

    "card.objective.public_2:pok/achieve_supremacy": () => {
        // Flagship or war sun in other player's home or mecatol
        return ObjectivesGoalSuccess.checkSystemsWithFlagshipOrWarSunAlsoOthersHomeOrMecatol(
            1
        );
    },

    "card.objective.public_2:pok/become_a_legend": () => {
        // 4 systems with units where legendary, mecatol, or anomaly
        return ObjectivesGoalSuccess.checkSystemsWithUnitsInLegendaryMecatolOrAnomaly(
            4
        );
    },

    "card.objective.public_2:base/centralize_galactic_trade": () => {
        // 10 tradegoods
        return ObjectivesGoalSuccess.checkTradegoods(10);
    },

    "card.objective.public_2:pok/command_an_armada": () => {
        // 1 system with 8 non-fighter ships
        return ObjectivesGoalSuccess.checkMaxNonFighterShipsInSingleSystem(8);
    },

    "card.objective.public_2:base/conquer_the_weak": () => {
        // 1 planet in another's home system
        return ObjectivesGoalSuccess.checkPlanetsInOthersHome(1);
    },

    "card.objective.public_2:pok/construct_massive_cities": () => {
        // 7 structures
        return ObjectivesGoalSuccess.checkStructures(7);
    },

    "card.objective.public_2:pok/control_the_borderlands": () => {
        // 5 systems with units on edge
        return ObjectivesGoalSuccess.countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome(
            5
        );
    },

    "card.objective.public_2:base/form_galactic_brain_trust": () => {
        // 5 planets with tech
        return ObjectivesGoalSuccess.checkPlanetsWithTechSpecialties(5);
    },

    "card.objective.public_2:base/found_a_golden_age": () => {
        // 16 resources
        return ObjectivesGoalSuccess.checkResources(16);
    },

    "card.objective.public_2:base/galvanize_the_people": () => {
        // 6 tokens from tactics/strategy
        return ObjectivesGoalSuccess.checkTokensInTacticAndStrategy(6);
    },

    "card.objective.public_2:pok/hold_vast_reserves": () => {
        // Spend 6 inf, 6 res, 6 tgs
        return ObjectivesGoalSuccess.checkInfResTgs(6);
    },

    "card.objective.public_2:base/manipulate_galactic_law": () => {
        // 16 influence
        return ObjectivesGoalSuccess.checkInfluence(16);
    },

    "card.objective.public_2:base/master_the_sciences": () => {
        // 2 tech in 4 colors
        return ObjectivesGoalSuccess.checkTwoTechInColors(4);
    },

    "card.objective.public_2:pok/patrol_vast_territories": () => {
        // 5 empty systems
        return ObjectivesGoalSuccess.checkSystemsWithoutPlanetsWithUnits(5);
    },

    "card.objective.public_2:pok/protect_the_border": () => {
        // 5 planets with structures outside own home
        return ObjectivesGoalSuccess.checkPlanetsWithStructuresOutsidePlayersHome(
            5
        );
    },

    "card.objective.public_2:pok/reclaim_ancient_monuments": () => {
        // 3 planets with attachments
        return ObjectivesGoalSuccess.checkPlanetsWithAttachments(3);
    },

    "card.objective.public_2:base/revolutionize_warfare": () => {
        // 3 unit upgrades
        return ObjectivesGoalSuccess.checkUnitUpgrades(3);
    },

    "card.objective.public_2:pok/rule_distant_lands": () => {
        // 2 planets in or adjacent to different other homes
        return ObjectivesGoalSuccess.checkSystemsWithControlledPlanetsInOrAdjToOthersHome(
            2
        );
    },

    "card.objective.public_2:base/subdue_the_galaxy": () => {
        // 11 planets non-home
        return ObjectivesGoalSuccess.checkPlanetsNonHome(11);
    },

    "card.objective.public_2:base/unify_the_colonies": () => {
        // 6 planets same trait
        return ObjectivesGoalSuccess.checkPlanetsSameTrait(6);
    },
};

const OBJECTIVE_NAME_ABBREVIATIONS = {
    // Public
    "card.objective.public_2:pok/achieve_supremacy": "FLAG/WS ON MR/HS",
    "card.objective.public_1:pok/amass_wealth": "3 INF 3 RES 3 TG",
    "card.objective.public_2:pok/become_a_legend": "4 LGND/MR/ANOM",
    "card.objective.public_1:pok/build_defenses": "4 STRUCTURES",
    "card.objective.public_2:base/centralize_galactic_trade": "10 TRADE GOODS",
    "card.objective.public_2:pok/command_an_armada": "8 NON-FGTR SHIPS",
    "card.objective.public_2:base/conquer_the_weak": "1 OPPONENT HOME",
    "card.objective.public_2:pok/construct_massive_cities": "7 STRUCTURES",
    "card.objective.public_2:pok/control_the_borderlands": "5 EDGE SYS",
    "card.objective.public_1:base/corner_the_market": "4 PLANET SAME TRAIT",
    "card.objective.public_1:base/develop_weaponry": "2 UNIT UPGRADES",
    "card.objective.public_1:pok/discover_lost_outposts": "2 ATTACHMENTS",
    "card.objective.public_1:base/diversify_research": "2 TECH 2 COLORS",
    "card.objective.public_1:pok/engineer_a_marvel": "FLAG/WAR SUN",
    "card.objective.public_1:base/erect_a_monument": "8 RESOURCES",
    "card.objective.public_1:base/expand_borders": "6 NON-HOME PLANET",
    "card.objective.public_1:pok/explore_deep_space": "3 EMPTY SYS",
    "card.objective.public_2:base/form_galactic_brain_trust":
        "5 TECH SPECIALTY",
    "card.objective.public_1:base/found_research_outposts": "3 TECH SPECIALTY",
    "card.objective.public_2:base/found_a_golden_age": "16 RESOURCES",
    "card.objective.public_2:base/galvanize_the_people": "6 COMMAND TOKENS",
    "card.objective.public_2:pok/hold_vast_reserves": "6 INF 6 RES 6 TG",
    "card.objective.public_1:pok/improve_infrastructure": "3 STRUCT NOT HOME",
    "card.objective.public_1:base/intimidate_council": "2 SYS ADJ TO MR",
    "card.objective.public_1:base/lead_from_the_front": "3 COMMAND TOKENS",
    "card.objective.public_1:pok/make_history": "2 LGND/MR/ANOM",
    "card.objective.public_2:base/manipulate_galactic_law": "16 INFLUENCE",
    "card.objective.public_2:base/master_the_sciences": "2 TECH 4 COLORS",
    "card.objective.public_1:base/negotiate_trade_routes": "5 TRADE GOODS",
    "card.objective.public_2:pok/patrol_vast_territories": "5 EMPTY SYS",
    "card.objective.public_1:pok/populate_the_outer_rim": "3 EDGE SYS",
    "card.objective.public_2:pok/protect_the_border": "5 STRUCT NOT HOME",
    "card.objective.public_1:pok/push_boundaries": "> 2 NGHBRS",
    "card.objective.public_1:pok/raise_a_fleet": "5 NON-FGTR SHIPS",
    "card.objective.public_2:pok/reclaim_ancient_monuments": "3 ATTACHMENTS",
    "card.objective.public_2:base/revolutionize_warfare": "3 UNIT UPGRADES",
    "card.objective.public_2:pok/rule_distant_lands": "2 IN/ADJ OTHER HS",
    "card.objective.public_2:base/subdue_the_galaxy": "11 NON-HOME PLANET",
    "card.objective.public_1:base/sway_the_council": "8 INFLUENCE",
    "card.objective.public_2:base/unify_the_colonies": "6 PLANET SAME TRAIT",
};

module.exports = {
    NSID_OBJECTIVE_PROGRESS,
    OBJECTIVE_NAME_ABBREVIATIONS,
};
