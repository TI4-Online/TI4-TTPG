require("../../global"); // create world.TI4, etc
const assert = require("assert");
const { ObjectivesGoalCount } = require("./objectives-goal-count");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockRotator,
    world,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

it("no constructor", () => {
    assert.throws(() => {
        new ObjectivesGoalCount();
    });
});

it("_getControlledPlanets", () => {
    world.__clear();

    const playerSlots = world.TI4.getAllPlayerDesks().map(
        (desk) => desk.playerSlot
    );

    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        owningPlayerSlot: playerSlots[0],
    });
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlots[0], // redundant
    });
    const dreadnought = new MockGameObject({
        templateMetadata: "unit:base/dreadnought", // not planet!
        owningPlayerSlot: playerSlots[1],
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);
    world.__addObject(pds);
    world.__addObject(dreadnought);

    const controlled = ObjectivesGoalCount._getControlledPlanets();

    world.__clear;

    const distilled = controlled.map((entries) => {
        return entries.map((entry) => {
            return {
                hex: entry.hex,
                objNsid: ObjectNamespace.getNsid(entry.obj),
                planetLocaleName: entry.planet.localeName,
            };
        });
    });
    assert.deepEqual(distilled, [
        [
            {
                hex: "<0,0,0>",
                objNsid: "unit:base/pds",
                planetLocaleName: "planet.mecatol_rex",
            },
        ],
        [],
        [],
        [],
        [],
        [],
    ]);

    world.__clear();
});

it("countInfResTgs", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const planet_1_3 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/centauri",
            }),
        ],
        faceUp: true,
        position,
    });
    const planet_1_6 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/mecatol_rex",
            }),
        ],
        faceUp: true,
        position,
    });
    const tragegood1 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_1",
        rotation: new MockRotator(0, 0, 180),
        position,
    });

    world.__addObject(planet_1_3);
    world.__addObject(planet_1_6);
    world.__addObject(tragegood1);

    const count = ObjectivesGoalCount.countInfResTgs();
    assert.deepEqual(count, [
        { inf: 9, res: 2, tgs: 1 },
        { inf: 0, res: 0, tgs: 0 },
        { inf: 0, res: 0, tgs: 0 },
        { inf: 0, res: 0, tgs: 0 },
        { inf: 0, res: 0, tgs: 0 },
        { inf: 0, res: 0, tgs: 0 },
    ]);

    world.__clear();
});

it("countPlanetTraits", () => {
    world.__clear();

    const count = ObjectivesGoalCount.countPlanetTraits();
    assert.deepEqual(count, [
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
    ]);

    world.__clear();
});

it("countStructures", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
    });
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });

    world.__addObject(pds);
    world.__addObject(mecatol);

    const count = ObjectivesGoalCount.countStructures();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
});
