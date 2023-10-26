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
const {
    AbstractPlanetAttachment,
} = require("../../objects/attachments/abstract-planet-attachment");
const { Hex } = require("../hex");

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

it("countFlagshipsAndWarSuns", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const flagship = new MockGameObject({
        templateMetadata: "unit:base/flagship",
        owningPlayerSlot: playerSlot,
    });
    const warsun = new MockGameObject({
        templateMetadata: "unit:base/war_sun",
        owningPlayerSlot: playerSlot,
    });
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });

    world.__addObject(flagship);
    world.__addObject(warsun);
    world.__addObject(mecatol);

    const count = ObjectivesGoalCount.countFlagshipsAndWarSuns();
    assert.deepEqual(count, [2, 0, 0, 0, 0, 0]);

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

it("countPlanetsNonHome", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const cultural1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/quann",
            }),
        ],
        faceUp: true,
        position,
    });
    const cultural2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/lodor",
            }),
        ],
        faceUp: true,
        position,
    });
    const home = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/sol",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(cultural1);
    world.__addObject(cultural2);
    world.__addObject(home);

    const count = ObjectivesGoalCount.countPlanetsNonHome();
    assert.deepEqual(count, [2, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countPlanetTraits", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const cultural1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/quann",
            }),
        ],
        faceUp: true,
        position,
    });
    const cultural2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/lodor",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(cultural1);
    world.__addObject(cultural2);

    const count = ObjectivesGoalCount.countPlanetTraits();
    assert.deepEqual(count, [
        { cultural: 2, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
        { cultural: 0, hazardous: 0, industrial: 0 },
    ]);

    world.__clear();
});

it("countPlanetsWithAttachments", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const cultural1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/quann",
            }),
        ],
        faceUp: true,
        position,
    });
    const cultural2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/lodor",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(cultural1);
    world.__addObject(cultural2);

    // Test one real, one "not counted" attachment.
    const planet = world.TI4.getPlanetByCard(cultural1);
    const attachReal = AbstractPlanetAttachment.createForKnownAttachmentToken(
        new MockGameObject({
            templateMetadata:
                "token.attachment.exploration:pok/biotic_facility",
        })
    );
    planet.attachments.push(attachReal); // attach twice, make sure only counts once
    planet.attachments.push(attachReal);
    const count1 = ObjectivesGoalCount.countPlanetsWithAttachments();
    planet.attachments.pop();
    planet.attachments.pop();

    const attachFake = AbstractPlanetAttachment.createForKnownAttachmentToken(
        new MockGameObject({
            templateMetadata: "token.keleres:codex.vigil/custodia_vigilia",
        })
    );

    planet.attachments.push(attachFake);
    const count2 = ObjectivesGoalCount.countPlanetsWithAttachments();
    planet.attachments.pop();

    assert.deepEqual(count1, [1, 0, 0, 0, 0, 0]);
    assert.deepEqual(count2, [0, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countPlanetsWithStructuresOutsidePlayersHome", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const otherPlayerSlot = world.TI4.getAllPlayerDesks()[1].playerSlot;
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
    });
    const home = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: playerSlot,
    });
    const notMyHome = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: otherPlayerSlot,
    });

    world.__addObject(pds);
    world.__addObject(home);
    let count =
        ObjectivesGoalCount.countPlanetsWithStructuresOutsidePlayersHome();
    assert.deepEqual(count, [0, 0, 0, 0, 0, 0]);

    world.__clear();
    world.__addObject(pds);
    world.__addObject(notMyHome);
    count = ObjectivesGoalCount.countPlanetsWithStructuresOutsidePlayersHome();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countPlanetsWithTechSpecialties", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const planetTech1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/wellon",
            }),
        ],
        faceUp: true,
        position,
    });
    const planetTech2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/thibah",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(planetTech1);
    world.__addObject(planetTech2);

    const count = ObjectivesGoalCount.countPlanetsWithTechSpecialties();

    assert.deepEqual(count, [2, 0, 0, 0, 0, 0]);

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

it("countSystemsWithoutPlanetsWithUnits", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
    });
    const zeroPlanetSystem = new MockGameObject({
        templateMetadata: "tile.system:base/39",
    });

    world.__addObject(pds);
    world.__addObject(zeroPlanetSystem);

    const count = ObjectivesGoalCount.countSystemsWithoutPlanetsWithUnits();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countSystemsWithShipsAdjToMecatol", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const adjPos = Hex.toPosition("<1,0,-1>");
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const adjToMecatol = new MockGameObject({
        templateMetadata: "tile.system:base/19",
        position: adjPos,
    });
    const shipOnMecatol = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerSlot,
    });
    const shipAdj = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerSlot,
        position: adjPos,
    });
    const nonShipAdj1 = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
        position: adjPos,
    });
    const nonShipAdj2 = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
        position: adjPos,
    });
    world.__addObject(mecatol);
    world.__addObject(adjToMecatol);
    world.__addObject(shipOnMecatol);
    world.__addObject(shipAdj);
    world.__addObject(nonShipAdj1);
    world.__addObject(nonShipAdj2);

    const count = ObjectivesGoalCount.countSystemsWithShipsAdjToMecatol();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countTechnologyColors", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const blue1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.technology.blue.empyrean:pok/aetherstream",
            }),
        ],
        faceUp: true,
        position,
    });
    const blue2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.technology.blue:base/gravity_drive",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(blue1);
    world.__addObject(blue2);

    const count = ObjectivesGoalCount.countTechnologyColors();
    assert.deepEqual(count, [
        { blue: 2, green: 0, red: 0, yellow: 0 },
        { blue: 0, green: 0, red: 0, yellow: 0 },
        { blue: 0, green: 0, red: 0, yellow: 0 },
        { blue: 0, green: 0, red: 0, yellow: 0 },
        { blue: 0, green: 0, red: 0, yellow: 0 },
        { blue: 0, green: 0, red: 0, yellow: 0 },
    ]);

    world.__clear();
});

it("countUnitUpgradeTechnologies", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const upgrade1 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.technology.unit_upgrade:base/dreadnought_2",
            }),
        ],
        faceUp: true,
        position,
    });
    const upgrade2 = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata:
                    "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(upgrade1);
    world.__addObject(upgrade2);

    const count = ObjectivesGoalCount.countUnitUpgradeTechnologies();
    assert.deepEqual(count, [2, 0, 0, 0, 0, 0]);

    world.__clear();
});
