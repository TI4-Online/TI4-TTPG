require("../../global"); // create world.TI4, etc
const assert = require("assert");
const {
    AbstractPlanetAttachment,
} = require("../../objects/attachments/abstract-planet-attachment");
const { Hex } = require("../hex");
const { ObjectivesGoalCount } = require("./objectives-goal-count");
const { ObjectNamespace } = require("../object-namespace");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    MockRotator,
    globalEvents,
    world,
} = require("../../wrapper/api");

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

it("countMaxNonFighterShipsInSingleSystem", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const home = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: playerSlot,
    });
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
    });
    const fighter = new MockGameObject({
        templateMetadata: "unit:base/pds",
        owningPlayerSlot: playerSlot,
    });
    const carrier = new MockGameObject({
        templateMetadata: "unit:base/carrier",
        owningPlayerSlot: playerSlot,
    });
    const cruiser = new MockGameObject({
        templateMetadata: "unit:base/cruiser",
        owningPlayerSlot: playerSlot,
    });
    const dreadnought = new MockGameObject({
        templateMetadata: "unit:base/dreadnought",
        owningPlayerSlot: playerSlot,
    });

    world.__addObject(home);
    world.__addObject(pds);
    world.__addObject(fighter);
    world.__addObject(carrier);
    world.__addObject(cruiser);
    world.__addObject(dreadnought);
    let count = ObjectivesGoalCount.countMaxNonFighterShipsInSingleSystem();
    assert.deepEqual(count, [3, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countPlanetsAndGetNeighbors", () => {
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
                metadata: "card.planet:base/jord",
            }),
        ],
        faceUp: true,
        position,
    });
    world.__addObject(cultural1);
    world.__addObject(cultural2);
    world.__addObject(home);

    const count = ObjectivesGoalCount.countPlanetsAndGetNeighbors();
    assert.deepEqual(count, [
        { neighbors: [], planets: 3 },
        { neighbors: [], planets: 0 },
        { neighbors: [], planets: 0 },
        { neighbors: [], planets: 0 },
        { neighbors: [], planets: 0 },
        { neighbors: [], planets: 0 },
    ]);

    world.__clear();
});

it("countPlanetsInOthersHome", () => {
    world.__clear();

    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    const myFactionSheet = new MockGameObject({
        templateMetadata: "sheet.faction:base/arborec",
        position: playerDesk.center,
    });
    const othersHome = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/jord",
            }),
        ],
        faceUp: true,
        position: playerDesk.center,
    });

    world.__addObject(othersHome);
    world.__addObject(myFactionSheet);
    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(playerDesk.playerSlot, player);

    const count = ObjectivesGoalCount.countPlanetsInOthersHome();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

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
                metadata: "card.planet:base/jord",
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

it("countSystemsWithControlledPlanetsInOrAdjToOthersHome", () => {
    world.__clear();

    const playerSlots = world.TI4.getAllPlayerDesks().map(
        (desk) => desk.playerSlot
    );
    const playerSlot = playerSlots[0];
    const otherPlayerSlot = playerSlots[1];

    const othersHome = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: otherPlayerSlot,
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        owningPlayerSlot: playerSlot,
    });

    world.__clear();
    world.__addObject(othersHome);
    world.__addObject(controlToken);

    const count =
        ObjectivesGoalCount.countSystemsWithControlledPlanetsInOrAdjToOthersHome();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear;
});

it("countSystemsWithFlagshipOrWarSunAlsoOthersHomeOrMecatol", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const pds = new MockGameObject({
        templateMetadata: "unit:base/flagship",
        owningPlayerSlot: playerSlot,
    });
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });

    world.__addObject(pds);
    world.__addObject(mecatol);

    const count =
        ObjectivesGoalCount.countSystemsWithFlagshipOrWarSunAlsoOthersHomeOrMecatol();
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

it("countSystemsWithUnitsInLegendaryMecatolOrAnomaly", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const legendary = new MockGameObject({
        templateMetadata: "tile.system:base/65",
    });
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const anomaly = new MockGameObject({
        templateMetadata: "tile.system:base/41",
    });
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerSlot,
    });

    world.__addObject(legendary);
    world.__addObject(unit);
    let count =
        ObjectivesGoalCount.countSystemsWithUnitsInLegendaryMecatolOrAnomaly();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
    world.__addObject(mecatol);
    world.__addObject(unit);
    count =
        ObjectivesGoalCount.countSystemsWithUnitsInLegendaryMecatolOrAnomaly();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
    world.__addObject(anomaly);
    world.__addObject(unit);
    count =
        ObjectivesGoalCount.countSystemsWithUnitsInLegendaryMecatolOrAnomaly();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    count =
        ObjectivesGoalCount.countSystemsWithUnitsInLegendaryMecatolOrAnomaly();
    assert.deepEqual(count, [0, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome", () => {
    world.__clear();

    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const unit1 = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerSlot,
    });
    const unit2 = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerSlot,
    });

    world.__addObject(emptySystemTile);
    world.__addObject(unit1);
    world.__addObject(unit2); // same system

    const count =
        ObjectivesGoalCount.countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome();
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

it("countTokensInTacticAndStrategy", () => {
    world.__clear();
    const playerDesk = world.TI4.getAllPlayerDesks()[0];

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            position: playerDesk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            position: playerDesk.center.add([8, 0, 0]),
        })
    );

    const count = ObjectivesGoalCount.countTokensInTacticAndStrategy();
    assert.deepEqual(count, [1, 0, 0, 0, 0, 0]);

    world.__clear();
});

it("countTradegoods", () => {
    world.__clear();

    const position = world.TI4.getAllPlayerDesks()[0].center;
    const commodity1 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_1",
        rotation: new MockRotator(0, 0, 0),
        position,
    });
    const tragegood1 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_1",
        rotation: new MockRotator(0, 0, 180),
        position,
    });
    const commodity3 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_3",
        rotation: new MockRotator(0, 0, 0),
        position,
    });
    const tragegood3 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_3",
        rotation: new MockRotator(0, 0, 180),
        position,
    });

    world.__addObject(commodity1);
    world.__addObject(commodity3);
    world.__addObject(tragegood1);
    world.__addObject(tragegood3);

    const count = ObjectivesGoalCount.countTradegoods();
    assert.deepEqual(count, [4, 0, 0, 0, 0, 0]);

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
