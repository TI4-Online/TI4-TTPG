const assert = require("assert");
const { UnitModifierSchema } = require("./unit-modifier.schema");

it("pass", () => {
    const unitModifier = {
        localeName: "unit_modifier.name.demo",
        localeDescription: "unit_modifier.desc.demo",
        triggerNsid: "card.action:base/demo",
        owner: "self",
        priority: "mutate",
        isCombat: true,
        apply: (unitToUnitAttrs) => {},
    };
    assert(UnitModifierSchema.validate(unitModifier));
});

it("fail missing localeName, desc", () => {
    const unitModifier = {
        triggerNsid: "card.action:base/demo",
        owner: "self",
        type: "mutate",
        isCombat: true,
        apply: (unitToUnitAttrs) => {},
    };
    assert(!UnitModifierSchema.validate(unitModifier, (err) => {}));
});
