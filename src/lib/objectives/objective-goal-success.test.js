require("../../global"); // register world.TI4, etc
const assert = require("assert");
const { ObjectivesGoalSuccess } = require("./objectives-goal-success");
const { world } = require("../../wrapper/api");

function _verifyResultTypes(result) {
    assert(typeof result === "object");
    assert(typeof result.header === "string");
    assert(Array.isArray(result.values));
    assert(result.values.length === world.TI4.config.playerCount);
    for (const value of result.values) {
        assert(
            typeof value.value === "string" || typeof value.value === "number"
        );
        assert(typeof value.success === "boolean");
    }
}

it("checkFlagshipOrWarSun", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkFlagshipOrWarSun(1));
});

it("checkInfluence", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkInfluence(1));
});

it("checkInfResTgs", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkInfResTgs(1));
});

it("checkMaxNonFighterShipsInSingleSystem", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkMaxNonFighterShipsInSingleSystem(1)
    );
});

it("checkMorePlanetsThan2Neighbors", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkMorePlanetsThan2Neighbors());
});

it("checkPlanetsNonHome", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkPlanetsNonHome(1));
});

it("checkPlanetsSameTrait", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkPlanetsSameTrait(1));
});

it("checkPlanetsWithAttachments", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkPlanetsWithAttachments(1));
});

it("checkPlanetsWithTechSpecialties", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkPlanetsWithTechSpecialties(1)
    );
});

it("checkResources", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkResources(1));
});

it("checkStructures", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkStructures(1));
});

it("checkPlanetsWithStructuresOutsidePlayersHome", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkPlanetsWithStructuresOutsidePlayersHome(1)
    );
});

it("checkSystemsWithoutPlanetsWithUnits", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkSystemsWithoutPlanetsWithUnits(1)
    );
});

it("checkSystemsWithShipsAdjToMecatol", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkSystemsWithShipsAdjToMecatol(1)
    );
});

it("checkSystemsWithUnitsInLegendaryMecatolOrAnomaly", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkSystemsWithUnitsInLegendaryMecatolOrAnomaly(
            1
        )
    );
});

it("checkSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome", () => {
    _verifyResultTypes(
        ObjectivesGoalSuccess.checkSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome(
            1
        )
    );
});

it("checkTechInTwoColors", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkTechInTwoColors(1));
});

it("checkTokensInTacticAndStrategy", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkTokensInTacticAndStrategy(1));
});

it("checkTradegoods", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkTradegoods(1));
});

it("checkUnitUpgrades", () => {
    _verifyResultTypes(ObjectivesGoalSuccess.checkUnitUpgrades(1));
});
