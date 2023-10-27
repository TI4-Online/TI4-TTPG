const { ObjectivesGoalSuccess } = require("./objectives-goal-success");

/**
 * Function returns an array from desk index to simple progress string.
 *
 * Object.{header:string,values:Array.{value:string|number,success:boolean}}}
 */
const NSID_TO_GET_PROGRESS = {
    // Spend 3 inf, 3 res, 3 tgs
    "card.objective.public_1:pok/amass_wealth": () => {
        return ObjectivesGoalSuccess.checkInfResTgs(3);
    },

    // 4 structures
    "card.objective.public_1:pok/build_defenses": () => {
        return ObjectivesGoalSuccess.checkStructures(4);
    },

    // 4 planets same trait
    "card.objective.public_1:base/corner_the_market": () => {
        return ObjectivesGoalSuccess.checkPlanetsSameTrait(4);
    },

    // 2 unit upgrades
    "card.objective.public_1:base/develop_weaponry": () => {
        return ObjectivesGoalSuccess.checkUnitUpgrades(2);
    },

    // 2 planets with attachments
    "card.objective.public_1:pok/discover_lost_outposts": () => {
        return ObjectivesGoalSuccess.checkPlanetsWithAttachments(2);
    },

    // 2 tech in 2 colors
    "card.objective.public_1:base/diversify_research": () => {
        return ObjectivesGoalSuccess.checkTechInTwoColors(2);
    },

    // Flagship or war sun
    "card.objective.public_1:pok/engineer_a_marvel": () => {
        return ObjectivesGoalSuccess.checkFlagshipOrWarSun(1);
    },

    // 8 resources
    "card.objective.public_1:base/erect_a_monument": () => {
        return ObjectivesGoalSuccess.checkResources(8);
    },

    // 6 planets non-home
    "card.objective.public_1:base/expand_borders": () => {
        return ObjectivesGoalSuccess.checkPlanetsNonHome(6);
    },

    // 3 empty systems
    "card.objective.public_1:pok/explore_deep_space": () => {
        return ObjectivesGoalSuccess.checkSystemsWithoutPlanetsWithUnits(3);
    },

    // 3 planets with tech
    "card.objective.public_1:base/found_research_outposts": () => {
        return ObjectivesGoalSuccess.checkPlanetsWithTechSpecialties(3);
    },

    // 3 structures outside own home
    "card.objective.public_1:pok/improve_infrastructure": () => {
        return ObjectivesGoalSuccess.checkPlanetsWithStructuresOutsidePlayersHome(
            3
        );
    },

    // 2 systems with ships adj to mecatol
    "card.objective.public_1:base/intimidate_council": () => {
        return ObjectivesGoalSuccess.checkSystemsWithShipsAdjToMecatol(2);
    },

    // 3 tokens from tactics/strategy
    "card.objective.public_1:base/lead_from_the_front": () => {
        return ObjectivesGoalSuccess.checkTokensInTacticAndStrategy(3);
    },

    // 3 systems with legendary, mecatol, or anomaly
    "card.objective.public_1:pok/make_history": () => {
        return ObjectivesGoalSuccess.checkSystemsWithUnitsInLegendaryMecatolOrAnomaly(
            3
        );
    },

    // 5 tradegoods
    "card.objective.public_1:base/negotiate_trade_routes": () => {
        return ObjectivesGoalSuccess.checkTradegoods(5);
    },

    // 3 systems with units on edge
    "card.objective.public_1:pok/populate_the_outer_rim": () => {
        return ObjectivesGoalSuccess.countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome(
            3
        );
    },

    // More planets than 2 neighbors
    "card.objective.public_1:pok/push_boundaries": () => {
        return ObjectivesGoalSuccess.checkMorePlanetsThan2Neighbors();
    },

    // 1 system with 5 non-fighter ships
    "card.objective.public_1:pok/raise_a_fleet": () => {
        return ObjectivesGoalSuccess.checkMaxNonFighterShipsInSingleSystem(5);
    },

    // 8 influence
    "card.objective.public_1:base/sway_the_council": () => {
        return ObjectivesGoalSuccess.checkInfluence(8);
    },

    "card.objective.public_2:pok/achieve_supremacy": () => {},
    "card.objective.public_2:pok/become_a_legend": () => {},
    "card.objective.public_2:base/centralize_galactic_trade": () => {},
    "card.objective.public_2:pok/command_an_armada": () => {},
    "card.objective.public_2:base/conquer_the_weak": () => {},
    "card.objective.public_2:pok/construct_massive_cities": () => {},
    "card.objective.public_2:pok/control_the_borderlands": () => {},
    "card.objective.public_2:base/form_galactic_brain_trust": () => {},
    "card.objective.public_2:base/found_a_golden_age": () => {},
    "card.objective.public_2:base/galvanize_the_people": () => {},
    "card.objective.public_2:pok/hold_vast_reserves": () => {},
    "card.objective.public_2:base/manipulate_galactic_law": () => {},
    "card.objective.public_2:base/master_the_sciences": () => {},
    "card.objective.public_2:pok/patrol_vast_territories": () => {},
    "card.objective.public_2:pok/protect_the_border": () => {},
    "card.objective.public_2:pok/reclaim_ancient_monuments": () => {},
    "card.objective.public_2:base/revolutionize_warfare": () => {},
    "card.objective.public_2:pok/rule_distant_lands": () => {},
    "card.objective.public_2:base/subdue_the_galaxy": () => {},
    "card.objective.public_2:base/unify_the_colonies": () => {},
};

module.exports = {
    NSID_TO_GET_PROGRESS,
};
