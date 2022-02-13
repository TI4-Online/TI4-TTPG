const assert = require("assert");
const locale = require("../locale");
const { Faction } = require("../faction/faction");
const { UnitAttrsSchema } = require("./unit-attrs.schema");
const { UnitAttrs } = require("./unit-attrs");
const UNIT_ATTRS = require("./unit-attrs.data");
const UNIT_MODIFIERS = require("./unit-modifier.data");
const { world, MockCard, MockCardDetails } = require("../../mock/mock-api");

function _getUnitUpgrade(unitName) {
    for (const rawAttrs of UNIT_ATTRS) {
        if ((rawAttrs.upgradeLevel || 1) > 1) {
            return new UnitAttrs(rawAttrs);
        }
    }
    throw new Error("unknown " + unitName);
}

it("UNIT_ATTRS schema", () => {
    for (const rawAttrs of UNIT_ATTRS) {
        if (!UnitAttrsSchema.validate(rawAttrs)) {
            console.log(rawAttrs);
            assert(false);
        }
    }
});

it("UNIT_ATTRS locale", () => {
    for (const rawAttrs of UNIT_ATTRS) {
        const assertLocaleKey = (localeKey) => {
            const s = locale(localeKey);
            if (s === localeKey) {
                console.error(rawAttrs);
            }
            assert(s !== localeKey); // yarn dev to (re)build lang
        };
        assertLocaleKey(rawAttrs.localeName);
        const unitModifier = rawAttrs.unitModifier;
        if (unitModifier) {
            assertLocaleKey(unitModifier.localeName);
            assertLocaleKey(unitModifier.localeDescription);
        }
    }
});

it("UNIT_ATTRS unitAbility", () => {
    const triggerUnitAbilitySet = new Set();
    for (const rawModifier of UNIT_MODIFIERS) {
        if (rawModifier.triggerUnitAbility) {
            triggerUnitAbilitySet.add(rawModifier.triggerUnitAbility);
        }
    }
    // Make sure all unit abilities match a registered unit modifier.
    for (const rawAttrs of UNIT_ATTRS) {
        assert(!rawAttrs.triggerUnitAbility); // units generate, modifiers are triggered
        if (rawAttrs.unitAbility) {
            assert(triggerUnitAbilitySet.has(rawAttrs.unitAbility));
        }
    }
});

it("static getDefaultUnitAttrs", () => {
    const fighter = UnitAttrs.getDefaultUnitAttrs("fighter");
    assert(fighter instanceof UnitAttrs);
    assert.equal(fighter.raw.unit, "fighter");
});

it("static getAllUnitTypes", () => {
    const all = UnitAttrs.getAllUnitTypes();
    assert(all.includes("fighter"));
});

it("static getNsidNameUnitUpgrade", () => {
    const fighter2 = UnitAttrs.getNsidNameUnitUpgrade("fighter_2");
    assert.equal(fighter2.raw.unit, "fighter");
    assert.equal(fighter2.raw.upgradeLevel, 2);
});

it("static sortUpgradeLevelOrder", () => {
    const carrier2 = _getUnitUpgrade("carrier");
    const carrier3 = _getUnitUpgrade("carrier");
    carrier3.raw.upgradeLevel = 3;

    let upgrades = [carrier2, carrier3];
    UnitAttrs.sortUpgradeLevelOrder(upgrades);
    assert.deepEqual(upgrades, [carrier2, carrier3]);

    upgrades = [carrier3, carrier2];
    UnitAttrs.sortUpgradeLevelOrder(upgrades);
    assert.deepEqual(upgrades, [carrier2, carrier3]);
});

it("static getPlayerUnitUpgrades", () => {
    world.__clear();

    const myPlayerSlot = 7;
    const cardObjCarrier2 = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.technology.unit_upgrade:base/carrier_2",
        }),
        owningPlayerSlot: myPlayerSlot,
    });
    assert.equal(cardObjCarrier2.getOwningPlayerSlot(), myPlayerSlot);
    const cardObjCruiser2FaceDown = new MockCard({
        cardDetails: new MockCardDetails({
            metadata: "card.technology.unit_upgrade:base/cruiser_2",
        }),
        owningPlayerSlot: myPlayerSlot,
        faceUp: false,
    });
    world.__addObject(cardObjCarrier2);
    world.__addObject(cardObjCruiser2FaceDown);
    const result = UnitAttrs.getPlayerUnitUpgrades(myPlayerSlot);
    world.__clear();
    assert.equal(result.length, 1);
    assert.equal(result[0].raw.unit, "carrier");
    assert.equal(result[0].raw.upgradeLevel, 2);
});

it("static getFactionUnitUpgrades", () => {
    const arborec = Faction.getByNsidName("arborec");
    const unitUpgraes = UnitAttrs.getFactionUnitUpgrades(arborec);
    assert.equal(unitUpgraes.length, 3); // mech, flagship, letani(1)
});

it("name", () => {
    const carrier = UnitAttrs.getDefaultUnitAttrs("carrier");
    assert(carrier instanceof UnitAttrs);
    assert.equal(typeof carrier.name, "string");
});

it("upgrade", () => {
    const carrier = UnitAttrs.getDefaultUnitAttrs("carrier");
    const carrier2 = _getUnitUpgrade("carrier");
    assert.equal(carrier.raw.unit, "carrier");
    assert.equal(carrier.raw.upgradeLevel, undefined);
    assert.equal(carrier.raw.move, 1);
    assert.equal(carrier2.raw.unit, "carrier");
    assert.equal(carrier2.raw.upgradeLevel, 2);
    assert.equal(carrier2.raw.move, 2);
    carrier.upgrade(carrier2);
    assert.equal(carrier.raw.unit, "carrier");
    assert.equal(carrier.raw.upgradeLevel, 2);
    assert.equal(carrier.raw.move, 2);
});

it("reject upgrade mismatch", () => {
    const carrier = UnitAttrs.getDefaultUnitAttrs("carrier");
    const cruiser2 = _getUnitUpgrade("cruiser");
    assert.throws(() => {
        UnitAttrs.upgrade(carrier, cruiser2);
    });
});
