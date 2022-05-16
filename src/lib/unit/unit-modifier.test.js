require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const locale = require("../locale");
const { ActiveIdle } = require("./active-idle");
const { AuxDataBuilder } = require("./auxdata");
const { ObjectNamespace } = require("../object-namespace");
const { UnitModifierSchema } = require("./unit-modifier.schema");
const { UnitModifier, PRIORITY, OWNER } = require("./unit-modifier");
const { UnitAttrs } = require("./unit-attrs");
const { UnitAttrsSet } = require("./unit-attrs-set");
const UNIT_MODIFIERS = require("./unit-modifier.data");
const {
    globalEvents,
    world,
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
} = require("../../mock/mock-api");

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

it("UNIT_MODIFIERS triggerIf", () => {
    const auxData = new AuxDataBuilder().build();
    for (const rawModifier of UNIT_MODIFIERS) {
        if (rawModifier.triggerIf) {
            rawModifier.triggerIf(auxData);
        }
    }
});

it("UNIT_MODIFIERS apply", () => {
    for (const rawModifier of UNIT_MODIFIERS) {
        const aux1 = new AuxDataBuilder().build();
        const aux2 = new AuxDataBuilder().build();
        aux1.setOpponent(aux2);
        aux2.setOpponent(aux1);
        for (const unit of UnitAttrs.getAllUnitTypes()) {
            aux1.overrideCount(unit, 1);
            aux2.overrideCount(unit, 1);
        }
        const unitModifier = new UnitModifier(rawModifier);
        const unitAttrsSet = new UnitAttrsSet();
        unitModifier.apply(unitAttrsSet, aux1);
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
    world.__clear();
    const myPlayerSlot = 7;
    const moraleBoost = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.action:base/morale_boost.3",
        }),
        owningPlayerSlot: myPlayerSlot,
    });
    world.__addObject(moraleBoost);
    const result = UnitModifier.getPlayerUnitModifiers(myPlayerSlot, "self");
    world.__clear();
    assert.equal(result.length, 1);
    assert.equal(result[0].raw.localeName, "unit_modifier.name.morale_boost");
});

it("static getFactionAbilityUnitModifier", () => {
    const result = UnitModifier.getFactionAbilityUnitModifier("fragile");
    assert.equal(result.raw.localeName, "unit_modifier.name.fragile");
});

it("active/idle", () => {
    const CARD_NSID = "card.leader.agent.sol:pok/evelyn_delouis";
    const MODIFIER_NAME = "unit_modifier.name.evelyn_delouis";
    world.__clear();
    const myPlayerSlot = 7;
    const toggleActiveCard = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: CARD_NSID,
        }),
        owningPlayerSlot: myPlayerSlot,
    });
    world.__addObject(toggleActiveCard);

    const nsid = ObjectNamespace.getNsid(toggleActiveCard);
    assert(UnitModifier.getNsidUnitModifier(nsid));
    assert(UnitModifier.isToggleActiveObject(toggleActiveCard));

    ActiveIdle.setActive(toggleActiveCard, false);
    const resultIdle = UnitModifier.getPlayerUnitModifiers(
        myPlayerSlot,
        "self"
    );

    ActiveIdle.setActive(toggleActiveCard, true);
    const resultActive = UnitModifier.getPlayerUnitModifiers(
        myPlayerSlot,
        "self"
    );

    world.__clear();
    assert.equal(resultIdle.length, 0);
    assert.equal(resultActive.length, 1);
    assert.equal(resultActive[0].raw.localeName, MODIFIER_NAME);
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

it("alliance", () => {
    const desks = world.TI4.getAllPlayerDesks();

    world.__clear();
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.leader.commander.winnu:pok/rickar_rickani",
            }),
            position: desks[0].center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet.faction:base/winnu",
            position: desks[0].center,
        })
    );
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.alliance:pok/winnu",
            }),
            position: desks[1].center,
        })
    );
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: `card.promissory.${desks[0].colorName}:base/alliance`,
            }),
            position: desks[2].center,
        })
    );

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desks[0].playerSlot, player);

    const result0 = UnitModifier.getPlayerUnitModifiers(
        desks[0].playerSlot,
        "self"
    );
    const result1 = UnitModifier.getPlayerUnitModifiers(
        desks[1].playerSlot,
        "self"
    );
    const result2 = UnitModifier.getPlayerUnitModifiers(
        desks[2].playerSlot,
        "self"
    );
    world.__clear();

    assert.equal(result0.length, 1);
    assert.equal(
        result0[0].raw.localeName,
        "unit_modifier.name.rickar_rickani"
    );

    assert.equal(result1.length, 1);
    assert.equal(
        result1[0].raw.localeName,
        "unit_modifier.name.rickar_rickani"
    );

    // The generic alliance promissory DOES NOT register.
    assert.equal(result2.length, 0);
});
