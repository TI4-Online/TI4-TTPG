const assert = require("assert");
const { AuxDataBuilder } = require("../unit/auxdata");
const { CombatRoller } = require("./combat-roller");
const { UnitModifier } = require("../unit/unit-modifier");
const { MockPlayer, MockVector } = require("../../wrapper/api");

it("constructor", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    new CombatRoller(auxData, rollType, player);
});

it("getModifierReport empty", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const report = combatRoller.getModifiersReport(true);
    assert.equal(report, "Roll modifiers: none");
});

it("getModifierReport", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    auxData.unitModifiers.push(
        UnitModifier.getFactionAbilityUnitModifier("fragile")
    );
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const report = combatRoller.getModifiersReport(true);
    assert.equal(report, "Roll modifier: Fragile (-1 to all COMBAT rolls)");
});
it("getRollReport", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    auxData.overrideCount("destroyer", 2);
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const dicePos = new MockVector(0, 0, 0);
    const unitToDice = combatRoller.spawnDice(dicePos);
    for (let i = 0; i < 4; i++) {
        unitToDice["destroyer"][i].roll(() => {});
        unitToDice["destroyer"][i].finishRoll();
    }
    const report = combatRoller.getRollReport(unitToDice);
    assert(report.includes("Destroyer [HIT:9(x2)]: 1, 1, 1, 1"));
});

it("getUnitToDiceCount", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    auxData.overrideCount("destroyer", 2);
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const unitToDiceCount = combatRoller.getUnitToDiceCount();
    assert.equal(unitToDiceCount["destroyer"], 4);
});

it("spawnDice", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    auxData.overrideCount("destroyer", 2);
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const dicePos = new MockVector(0, 0, 0);
    const unitToDice = combatRoller.spawnDice(dicePos);
    assert.equal(unitToDice["destroyer"].length, 4);
});

it("roll", () => {
    const auxData = new AuxDataBuilder().build();
    const rollType = "antiFighterBarrage";
    const player = new MockPlayer();
    auxData.overrideCount("destroyer", 2);
    const combatRoller = new CombatRoller(auxData, rollType, player);
    const dicePos = new MockVector(0, 0, 0);
    const dice = combatRoller.roll(dicePos);
    assert.equal(dice.length, 4);
});
