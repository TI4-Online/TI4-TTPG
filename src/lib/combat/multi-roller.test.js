const assert = require("assert");
const { AuxData } = require("../unit/auxdata");
const { MultiRoller } = require("./multi-roller");
const { UnitModifier } = require("../unit/unit-modifier");
const { MockPlayer, MockVector } = require("../../wrapper/api");

it("constructor", () => {
    new MultiRoller();
});

it("static getModifierReport empty", () => {
    const unitModifiers = [];
    const report = MultiRoller.getModifiersReport(unitModifiers);
    assert.equal(report, "Roll modifiers: none");
});

it("static getModifierReport", () => {
    const unitModifiers = [
        UnitModifier.getFactionAbilityUnitModifier("fragile"),
    ];
    const report = MultiRoller.getModifiersReport(unitModifiers);
    assert.equal(report, "Roll modifier: Fragile (-1 to all COMBAT rolls)");
});

it("static getUnitToDiceCount", () => {
    const auxData = new AuxData(-1);
    auxData.overrideCount("destroyer", 2);
    const unitToDiceCount = MultiRoller.getUnitToDiceCount(
        auxData,
        "antiFighterBarrage"
    );
    assert.equal(unitToDiceCount["destroyer"], 4);
});

it("static spawnDice", () => {
    const auxData = new AuxData(-1);
    auxData.overrideCount("destroyer", 2);
    const player = new MockPlayer();
    const dicePos = new MockVector(0, 0, 0);
    const unitToDice = MultiRoller.spawnDice(
        auxData,
        "antiFighterBarrage",
        player,
        dicePos
    );
    assert.equal(unitToDice["destroyer"].length, 4);
});

it("static roll", () => {
    const auxData = new AuxData(-1);
    auxData.overrideCount("destroyer", 2);
    const player = new MockPlayer();
    const dicePos = new MockVector(0, 0, 0);
    const dice = MultiRoller.roll(
        auxData,
        "antiFighterBarrage",
        player,
        dicePos
    );
    assert.equal(dice.length, 4);
});
