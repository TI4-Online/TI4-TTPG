const assert = require("assert");
const locale = require("../locale");
const { UnitModifierSchema } = require("./unit-modifier.schema");
const { UnitModifier, PRIORITY, OWNER } = require("./unit-modifier");
const { UnitAttrs } = require("./unit-attrs");
const { UnitAttrsSet } = require("./unit-attrs-set");
const { AuxData } = require("./auxdata");
const UNIT_MODIFIERS = require("./unit-modifier.data");
const { world, MockCard, MockCardDetails } = require("../../mock/mock-api");

it("UNIT_MODIFIERS schema", () => {
    for (const rawModifier of UNIT_MODIFIERS) {
        assert(UnitModifierSchema.validate(rawModifier));
        assert(PRIORITY[rawModifier.priority]);
        assert(OWNER[rawModifier.owner]);
    }
});

it("UNIT_MODIFIERS locale", () => {
    for (const rawModifier of UNIT_MODIFIERS) {
        const assertLocaleKey = (localeKey) => {
            const s = locale(localeKey);
            if (s === localeKey) {
                console.error(rawModifier);
            }
            assert(s !== localeKey); // yarn dev to (re)build lang
        };
        assertLocaleKey(rawModifier.localeName);
        assertLocaleKey(rawModifier.localeDescription);
    }
});

it("UNIT_MODIFIERS apply", () => {
    for (const rawModifier of UNIT_MODIFIERS) {
        const unitModifier = new UnitModifier(rawModifier);
        const unitAttrsSet = new UnitAttrsSet();
        const auxData = { self: new AuxData(-1), opponent: new AuxData(-1) };
        for (const unit of UnitAttrs.getAllUnitTypes()) {
            auxData.self.overrideCount(unit, 1);
            auxData.opponent.overrideCount(unit, 1);
        }
        unitModifier.apply(unitAttrsSet, auxData);
    }
});

it("static sortPriorityOrder", () => {
    const mutate = new UnitModifier({
        localeName: "-",
        localeDescription: "-",
        owner: "self",
        priority: "mutate",
    });
    const adjust = new UnitModifier({
        localeName: "-",
        localeDescription: "-",
        owner: "self",
        priority: "adjust",
    });
    const choose = new UnitModifier({
        localeName: "-",
        localeDescription: "-",
        owner: "self",
        priority: "choose",
    });
    let modifiers = [mutate, adjust, choose];
    UnitModifier.sortPriorityOrder(modifiers);
    assert.deepEqual(modifiers, [mutate, adjust, choose]);

    modifiers = [adjust, choose, mutate];
    UnitModifier.sortPriorityOrder(modifiers);
    assert.deepEqual(modifiers, [mutate, adjust, choose]);

    modifiers = [adjust, mutate, choose];
    UnitModifier.sortPriorityOrder(modifiers);
    assert.deepEqual(modifiers, [mutate, adjust, choose]);
});

it("static getPlayerUnitModifiers", () => {
    const myPlayerSlot = 7;
    const moraleBoost = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.action:base/morale_boost.3",
        }),
        owningPlayerSlot: myPlayerSlot,
    });
    let result;
    try {
        world.__addObject(moraleBoost);
        result = UnitModifier.getPlayerUnitModifiers(myPlayerSlot, "self");
    } finally {
        world.__clear();
    }
    assert.equal(result.length, 1);
    assert.equal(result[0].raw.localeName, "unit_modifier.name.morale_boost");
});

it("static getFactionAbilityUnitModifier", () => {
    const result = UnitModifier.getFactionAbilityUnitModifier("fragile");
    assert.equal(result.raw.localeName, "unit_modifier.name.fragile");
});

it("name/desc", () => {
    const moraleBoost = new UnitModifier({
        localeName: "unit_modifier.name.morale_boost",
        localeDescription: "unit_modifier.desc.morale_boost",
        owner: "self",
        priority: "adjust",
    });
    assert(moraleBoost instanceof UnitModifier);
    assert.equal(typeof moraleBoost.name, "string");
    assert.equal(typeof moraleBoost.desc, "string");
});

it("applyEach", () => {
    const unitModifier = new UnitModifier({
        localeName: "unit_modifier.name.morale_boost",
        localeDescription: "unit_modifier.desc.morale_boost",
        triggerNsids: [
            "card.action:base/morale_boost.1",
            "card.action:base/morale_boost.2",
            "card.action:base/morale_boost.3",
            "card.action:base/morale_boost.4",
        ],
        owner: "self",
        priority: "adjust",
        isCombat: true,
        applyEach: (unitAttrs, auxData) => {
            assert(unitAttrs instanceof UnitAttrs);
            if (unitAttrs.raw.spaceCombat) {
                unitAttrs.raw.spaceCombat.hit -= 1;
            }
            if (unitAttrs.raw.groundCombat) {
                unitAttrs.raw.groundCombat.hit -= 1;
            }
        },
    });

    const unitAttrsSet = new UnitAttrsSet();
    assert.equal(unitAttrsSet.get("fighter").raw.spaceCombat.hit, 9);
    assert.equal(unitAttrsSet.get("infantry").raw.groundCombat.hit, 8);

    unitModifier.apply(unitAttrsSet, unitModifier);
    assert.equal(unitAttrsSet.get("fighter").raw.spaceCombat.hit, 8);
    assert.equal(unitAttrsSet.get("infantry").raw.groundCombat.hit, 7);
});

it("applyAll", () => {
    const unitModifier = new UnitModifier({
        localeName: "unit_modifier.name.morale_boost",
        localeDescription: "unit_modifier.desc.morale_boost",
        triggerNsids: [
            "card.action:base/morale_boost.1",
            "card.action:base/morale_boost.2",
            "card.action:base/morale_boost.3",
            "card.action:base/morale_boost.4",
        ],
        owner: "self",
        priority: "adjust",
        isCombat: true,
        applyAll: (unitAttrsSet, auxData) => {
            assert(unitAttrsSet instanceof UnitAttrsSet);
            for (const unitAttrs of unitAttrsSet.values()) {
                if (unitAttrs.raw.spaceCombat) {
                    unitAttrs.raw.spaceCombat.hit -= 1;
                }
                if (unitAttrs.raw.groundCombat) {
                    unitAttrs.raw.groundCombat.hit -= 1;
                }
            }
        },
    });

    const unitAttrsSet = new UnitAttrsSet();
    assert.equal(unitAttrsSet.get("fighter").raw.spaceCombat.hit, 9);
    assert.equal(unitAttrsSet.get("infantry").raw.groundCombat.hit, 8);

    unitModifier.apply(unitAttrsSet, unitModifier);
    assert.equal(unitAttrsSet.get("fighter").raw.spaceCombat.hit, 8);
    assert.equal(unitAttrsSet.get("infantry").raw.groundCombat.hit, 7);
});
