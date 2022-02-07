const assert = require("assert");
const { AuxData } = require("../unit/auxdata");
const { MultiRoller } = require("./multi-roller");
const { UnitModifier } = require("../unit/unit-modifier");

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
