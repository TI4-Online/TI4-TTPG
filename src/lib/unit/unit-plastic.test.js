require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { UnitPlastic, _getUnitPlastic } = require("./unit-plastic");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("static getAll", () => {
    world.__clear();
    const fighter = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const fighter_x3 = new MockGameObject({
        templateMetadata: "token:base/fighter_3",
    });
    world.__addObject(fighter);
    world.__addObject(fighter_x3);
    const result = UnitPlastic.getAll();
    world.__clear();
    assert.equal(result.length, 2);
    assert.equal(result[0].gameObject, fighter);
    assert.equal(result[0].unit, "fighter");
    assert.equal(result[0].count, 1);
    assert.equal(result[1].gameObject, fighter_x3);
    assert.equal(result[1].unit, "fighter");
    assert.equal(result[1].count, 3);
});

it("static assignTokens", () => {
    const fighter = _getUnitPlastic(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: 7,
        })
    );
    const fighter_x3 = _getUnitPlastic(
        new MockGameObject({
            templateMetadata: "token:base/fighter_3",
        })
    );
    assert.equal(fighter.owningPlayerSlot, 7);
    assert.equal(fighter_x3.owningPlayerSlot, -1);

    UnitPlastic.assignTokens([fighter, fighter_x3]);
    assert.equal(fighter.owningPlayerSlot, 7);
    assert.equal(fighter_x3.owningPlayerSlot, 7);
});

it("static assignPlanets", () => {
    world.__clear();
    const infantry = new MockGameObject({
        templateMetadata: "unit:base/infantry",
        owningPlayerSlot: 7,
        position: new MockVector(0, 0, 0),
    });
    const system = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    world.__addObject(system);
    world.__addObject(infantry);
    const result = UnitPlastic.getAll();
    UnitPlastic.assignPlanets(result);
    world.__clear();
    assert.equal(result.length, 1);
    const unitPlastic = result[0];
    assert.equal(unitPlastic.gameObject, infantry);
    assert.equal(unitPlastic.unit, "infantry");
    assert.equal(unitPlastic.count, 1);
    assert(unitPlastic.planet);
    assert.equal(unitPlastic.planet.localeName, "planet.mecatol_rex");
});

it("constructor + getters", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const unitPlastic = new UnitPlastic("fighter", 1, gameObject);
    assert.equal(unitPlastic.unit, "fighter");
    assert.equal(unitPlastic.count, 1);
    assert.equal(unitPlastic.gameObject, gameObject);
    assert.equal(unitPlastic.hex, "<0,0,0>");
    assert.equal(unitPlastic.owningPlayerSlot, 7);
    assert(!unitPlastic.planet);
});
