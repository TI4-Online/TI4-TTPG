require("../../global"); // create world.TI4, etc
const assert = require("assert");
const { Hex } = require("../hex");
const { ObjectivesUtil } = require("./objectives-util");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    MockRotator,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

const NSID = {
    STAGE_1: "card.objective.public_1:pok/amass_wealth",
    STAGE_1_EXTRA: "card.objective.public_1:pok/build_defenses",
    STAGE_1_EXTRA2: "card.objective.public_1:base/corner_the_market",
    STAGE_2: "card.objective.public_2:pok/achieve_supremacy",
    SECRET: "card.objective.secret:base/adapt_new_strategies",
    OTHER: "token:base/custodians",
    PLANET_1_3: "card.planet:base/centauri",
    PLANET_TECH: "card.planet:base/gral",
    TECH_GREEN: "card.technology.green:base/hyper_metabolism",
    TECH_UNIT_UPGRADE: "card.technology.unit_upgrade:base/carrier_2",
};

const CARD = {
    STAGE_1: new MockCard({
        allCardDetails: [new MockCardDetails({ metadata: NSID.STAGE_1 })],
        faceUp: true,
    }),
    STAGE_1_EXTRA: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.STAGE_1_EXTRA,
            }),
        ],
        faceUp: true,
    }),
    STAGE_1_EXTRA2_FACE_DOWN: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.STAGE_1_EXTRA2,
            }),
        ],
        faceUp: false,
    }),
    STAGE_2: new MockCard({
        allCardDetails: [new MockCardDetails({ metadata: NSID.STAGE_2 })],
        faceUp: true,
    }),
    SECRET: new MockCard({
        allCardDetails: [new MockCardDetails({ metadata: NSID.SECRET })],
        faceUp: true,
    }),
    OTHER: new MockGameObject({
        templateMetadata: NSID.OTHER,
    }),
    PLANET_1_3: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.PLANET_1_3,
            }),
        ],
        faceUp: true,
    }),
    PLANET_TECH: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.PLANET_TECH,
            }),
        ],
        faceUp: true,
    }),
    TECH_GREEN: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.TECH_GREEN,
            }),
        ],
        faceUp: true,
    }),
    TECH_UNIT_UPGRADE: new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: NSID.TECH_UNIT_UPGRADE,
            }),
        ],
        faceUp: true,
    }),
};

it("no constructor", () => {
    assert.throws(() => {
        new ObjectivesUtil();
    });
});

it("_getObjectiveStage", () => {
    let stage = ObjectivesUtil._getObjectiveStage(NSID.STAGE_1);
    assert.equal(stage, 1);

    stage = ObjectivesUtil._getObjectiveStage(NSID.STAGE_1_EXTRA);
    assert.equal(stage, 1);

    stage = ObjectivesUtil._getObjectiveStage(NSID.STAGE_1_EXTRA2);
    assert.equal(stage, 1);

    stage = ObjectivesUtil._getObjectiveStage(NSID.STAGE_2);
    assert.equal(stage, 2);

    stage = ObjectivesUtil._getObjectiveStage(NSID.SECRET);
    assert.equal(stage, 8);

    stage = ObjectivesUtil._getObjectiveStage(NSID.OTHER);
    assert.equal(stage, 9);
});

it("_isOnStrategyCardMat", () => {
    assert(!ObjectivesUtil._isOnStrategyCardMat(CARD.STAGE_1));
});

it("_sortObjectives", () => {
    const sorted = [
        NSID.STAGE_1,
        NSID.STAGE_1_EXTRA,
        NSID.STAGE_1_EXTRA2,
        NSID.STAGE_2,
        NSID.SECRET,
        NSID.OTHER,
    ];

    let input = [
        CARD.STAGE_1,
        CARD.STAGE_1_EXTRA2_FACE_DOWN,
        CARD.STAGE_1_EXTRA,
        CARD.STAGE_2,
        CARD.SECRET,
        CARD.OTHER,
    ];
    let output = ObjectivesUtil._sortObjectives(input).map((x) =>
        ObjectNamespace.getNsid(x)
    );
    assert.deepEqual(output, sorted);

    input = [
        CARD.OTHER,
        CARD.SECRET,
        CARD.STAGE_2,
        CARD.STAGE_1_EXTRA2_FACE_DOWN,
        CARD.STAGE_1_EXTRA,
        CARD.STAGE_1,
    ];
    output = ObjectivesUtil._sortObjectives(input).map((x) =>
        ObjectNamespace.getNsid(x)
    );
    assert.deepEqual(output, sorted);

    input = [
        CARD.OTHER,
        CARD.STAGE_1_EXTRA,
        CARD.STAGE_1,
        CARD.SECRET,
        CARD.STAGE_1_EXTRA2_FACE_DOWN,
        CARD.STAGE_2,
    ];
    output = ObjectivesUtil._sortObjectives(input).map((x) =>
        ObjectNamespace.getNsid(x)
    );
    assert.deepEqual(output, sorted);
});

it("findPublicObjctivesAndAlreadyScored", () => {
    world.__clear();
    world.__addObject(CARD.STAGE_1);
    world.__addObject(CARD.STAGE_2);
    world.__addObject(CARD.STAGE_1_EXTRA2_FACE_DOWN);

    let objectives = ObjectivesUtil.findPublicObjctivesAndAlreadyScored();
    let nsids = objectives.map((x) => x.nsid);
    const scoredBy = objectives.map((x) => x.scoredBy);
    assert.deepEqual(nsids, [NSID.STAGE_1, NSID.STAGE_2]);
    assert.deepEqual(scoredBy, [[], []]); // not tested here

    const includeFaceDown = true;
    objectives =
        ObjectivesUtil.findPublicObjctivesAndAlreadyScored(includeFaceDown);
    nsids = objectives.map((x) => x.nsid);
    assert.deepEqual(nsids, [NSID.STAGE_1, NSID.STAGE_1_EXTRA2, NSID.STAGE_2]);

    world.__clear();
});

it("getDeskIndexClosest", () => {
    const deskIndex = 3;
    const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
    const obj = new MockGameObject({ position: playerDesk.center });
    const closestIndex = ObjectivesUtil.getDeskIndexClosest(obj);
    assert.equal(closestIndex, deskIndex);
});

it("getDeskIndexOwning", () => {
    const deskIndex = 3;
    const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
    const obj = new MockGameObject({ owningPlayerSlot: playerDesk.playerSlot });
    const closestIndex = ObjectivesUtil.getDeskIndexOwning(obj);
    assert.equal(closestIndex, deskIndex);
});

it("getHexIfUnitIsAdjacentToMecatol", () => {
    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const systemAdjToMecatol = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        position: Hex.toPosition("<1,0,-1>"),
    });
    const systemNotAdjToMecatol = new MockGameObject({
        templateMetadata: "tile.system:base/2",
        position: Hex.toPosition("<2,0,-2>"),
    });
    const unitAdj = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        position: Hex.toPosition("<1,0,-1>"),
        owningPlayerSlot: playerSlot,
    });
    const unitNotAdj = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        position: Hex.toPosition("<2,0,-2>"),
        owningPlayerSlot: playerSlot,
    });

    assert(playerSlot !== -1);
    assert.equal(unitAdj.getOwningPlayerSlot(), playerSlot);
    assert.equal(unitNotAdj.getOwningPlayerSlot(), playerSlot);

    world.__clear();
    world.__addObject(mecatol);
    world.__addObject(systemAdjToMecatol);
    world.__addObject(systemNotAdjToMecatol);
    world.__addObject(unitAdj);
    world.__addObject(unitNotAdj);
    let hex = ObjectivesUtil.getHexIfUnitIsAdjacentToMecatol(unitAdj);
    assert.equal(hex, "<1,0,-1>");
    hex = ObjectivesUtil.getHexIfUnitIsAdjacentToMecatol(unitNotAdj);
    assert(!hex);
    world.__clear();
});

it("getHexIfUnitIsInLegendaryMecatolOrAnomaly", () => {
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
    });

    world.__clear();
    world.__addObject(legendary);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsInLegendaryMecatolOrAnomaly(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(mecatol);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInLegendaryMecatolOrAnomaly(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(anomaly);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInLegendaryMecatolOrAnomaly(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInLegendaryMecatolOrAnomaly(unit);
    assert(!hex);

    world.__clear();
});

it("getHexIfUnitIsInOrAdjacentToOthersHome", () => {
    const playerSlot = world.TI4.getAllPlayerDesks()[0].playerSlot;
    const otherPlayerSlot = world.TI4.getAllPlayerDesks()[1].playerSlot;
    const othersHome = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: otherPlayerSlot,
    });
    const systemAdjToOthersHome = new MockGameObject({
        templateMetadata: "tile.system:base/20",
        position: Hex.toPosition("<1,0,-1>"),
    });
    const systemNotAdjToOthersHome = new MockGameObject({
        templateMetadata: "tile.system:base/21",
        position: Hex.toPosition("<2,0,-2>"),
    });
    const unitAdj = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        position: Hex.toPosition("<1,0,-1>"),
        owningPlayerSlot: playerSlot,
    });
    const unitNotAdj = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        position: Hex.toPosition("<2,0,-2>"),
        owningPlayerSlot: playerSlot,
    });

    assert(playerSlot !== -1);
    assert.equal(unitAdj.getOwningPlayerSlot(), playerSlot);
    assert.equal(unitNotAdj.getOwningPlayerSlot(), playerSlot);
    assert(otherPlayerSlot !== -1);
    assert.equal(othersHome.getOwningPlayerSlot(), otherPlayerSlot);
    assert.notEqual(playerSlot, otherPlayerSlot);

    world.__clear();
    world.__addObject(othersHome);
    world.__addObject(systemAdjToOthersHome);
    world.__addObject(systemNotAdjToOthersHome);
    world.__addObject(unitAdj);
    world.__addObject(unitNotAdj);
    let hex = ObjectivesUtil.getHexIfUnitIsInOrAdjacentToOthersHome(unitAdj);
    assert.equal(hex, "<1,0,-1>");
    hex = ObjectivesUtil.getHexIfUnitIsInOrAdjacentToOthersHome(unitNotAdj);
    assert(!hex);
    world.__clear();
});

it("getHexIfUnitInMecatol", () => {
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const notMecatol = new MockGameObject({
        templateMetadata: "tile.system:base/2",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
    });

    world.__clear();
    world.__addObject(mecatol);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitInMecatol(unit);

    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(notMecatol);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitInMecatol(unit);
    assert(!hex);

    world.__clear();
});

it("getHexIfUnitIsInOthersHomeSystem", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[1];
    const otherPlayerDesk = world.TI4.getAllPlayerDesks()[2];
    const myHome = new MockGameObject({
        templateMetadata: "tile.system:base/1",
        owningPlayerSlot: playerDesk.playerSlot,
    });
    const notMyHome = new MockGameObject({
        templateMetadata: "tile.system:base/2",
        owningPlayerSlot: otherPlayerDesk.playerSlot,
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: playerDesk.playerSlot,
    });

    world.__clear();
    world.__addObject(myHome);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsInOthersHomeSystem(unit);
    assert(!hex);

    world.__clear();
    world.__addObject(notMyHome);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInOthersHomeSystem(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
});

it("getHexIfUnitIsInSystem", () => {
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
    });

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsInSystem(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInSystem(unit);
    assert(!hex);

    world.__clear();
});

it("getHexIfUnitIsInZeroPlanetSystem", () => {
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const planetSystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/1",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
    });

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsInZeroPlanetSystem(unit);
    assert.equal(hex, "<0,0,0>");

    world.__clear();
    world.__addObject(planetSystemTile);
    world.__addObject(unit);
    hex = ObjectivesUtil.getHexIfUnitIsInZeroPlanetSystem(unit);
    assert.equal(hex, undefined);

    world.__clear();
});

it("getHexIfUnitIsOnEdgeOfGameBoardOtherThanHome", () => {
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
    });

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsOnEdgeOfGameBoardOtherThanHome(unit);
    assert.equal(hex, "<0,0,0>");
    world.__clear();
});

it("getHexIfUnitIsOutsideHome", () => {
    const emptySystemTile = new MockGameObject({
        templateMetadata: "tile.system:base/46",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/fighter",
    });

    world.__clear();
    world.__addObject(emptySystemTile);
    world.__addObject(unit);
    let hex = ObjectivesUtil.getHexIfUnitIsOutsideHome(unit);
    assert.equal(hex, "<0,0,0>");
    world.__clear();
});

it("getPlanetAttachmentCount", () => {
    const value = ObjectivesUtil.getPlanetAttachmentCount(CARD.PLANET_1_3);
    assert.equal(value, 0);
});

it("getPlanetInfluence", () => {
    const value = ObjectivesUtil.getPlanetInfluence(CARD.PLANET_1_3);
    assert.equal(value, 3);
});

it("getPlanetResources", () => {
    const value = ObjectivesUtil.getPlanetResources(CARD.PLANET_1_3);
    assert.equal(value, 1);
});

it("getPlanetTechSpecialties", () => {
    const value = ObjectivesUtil.getPlanetTechSpecialties(CARD.PLANET_TECH);
    assert.deepEqual(value, ["blue"]);
});

it("getPlanetTraits", () => {
    const value = ObjectivesUtil.getPlanetTraits(CARD.PLANET_1_3);
    assert.deepEqual(value, ["cultural"]);
});

it("getTechnologyCardColor", () => {
    let color = ObjectivesUtil.getTechnologyCardColor(CARD.TECH_GREEN);
    assert.equal(color, "green");
    color = ObjectivesUtil.getTechnologyCardColor(CARD.TECH_UNIT_UPGRADE);
    assert.equal(color, undefined);
});

it("getTradeGoods", () => {
    const commodity1 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_1",
        rotation: new MockRotator(0, 0, 0),
    });
    const tragegood1 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_1",
        rotation: new MockRotator(0, 0, 180),
    });
    const commodity3 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_3",
        rotation: new MockRotator(0, 0, 0),
    });
    const tragegood3 = new MockGameObject({
        templateMetadata: "token:base/tradegood_commodity_3",
        rotation: new MockRotator(0, 0, 180),
    });

    assert.equal(ObjectivesUtil.getTradeGoods(commodity1), 0);
    assert.equal(ObjectivesUtil.getTradeGoods(tragegood1), 1);
    assert.equal(ObjectivesUtil.getTradeGoods(commodity3), 0);
    assert.equal(ObjectivesUtil.getTradeGoods(tragegood3), 3);
});

it("getUnitPlanet", () => {
    world.__clear();
    const mecatol = new MockGameObject({
        templateMetadata: "tile.system:base/18",
    });
    const unit = new MockGameObject({
        templateMetadata: "unit:base/infantry",
    });
    world.__addObject(mecatol);
    world.__addObject(unit);

    const planetTileAndLocaleName = ObjectivesUtil.getUnitPlanet(unit);
    assert.deepEqual(planetTileAndLocaleName, {
        localeName: "planet.mecatol_rex",
        tile: 18,
    });

    world.__clear();
});

it("initialValues", () => {
    const values = ObjectivesUtil.initialValues({ a: 1 });
    assert.deepEqual(values, [
        { a: 1 },
        { a: 1 },
        { a: 1 },
        { a: 1 },
        { a: 1 },
        { a: 1 },
    ]);
    assert(values[0] !== values[1]); // not the same object
});

it("isFlagshipOrWarSun", () => {
    const obj1 = new MockGameObject({ templateMetadata: "unit:base/flagship" });
    const obj2 = new MockGameObject({ templateMetadata: "unit:base/war_sun" });
    const obj3 = new MockGameObject({ templateMetadata: "nope:nope/nope" });
    assert(ObjectivesUtil.isFlagshipOrWarSun(obj1));
    assert(ObjectivesUtil.isFlagshipOrWarSun(obj2));
    assert(!ObjectivesUtil.isFlagshipOrWarSun(obj3));
});

it("isNonFighterShip", () => {
    const obj1 = new MockGameObject({ templateMetadata: "unit:base/cruiser" });
    const obj2 = new MockGameObject({ templateMetadata: "unit:base/fighter" });
    assert(ObjectivesUtil.isNonFighterShip(obj1));
    assert(!ObjectivesUtil.isNonFighterShip(obj2));
});

it("isNonHomePlanetCard", () => {
    const value = ObjectivesUtil.isNonHomePlanetCard(CARD.PLANET_1_3);
    assert(value);
});

it("isOthersHomePlanetCard", () => {
    let value = ObjectivesUtil.isOthersHomePlanetCard(CARD.PLANET_1_3);
    assert(!value);

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

    value = ObjectivesUtil.isOthersHomePlanetCard(othersHome);
    assert(value);

    value = world.__clear();
});

it("isPlanetCard", () => {
    const value = ObjectivesUtil.isPlanetCard(CARD.PLANET_1_3);
    assert(value);
});

it("isShip", () => {
    const obj1 = new MockGameObject({ templateMetadata: "unit:base/fighter" });
    const obj2 = new MockGameObject({ templateMetadata: "nope:nope/nope" });
    assert(ObjectivesUtil.isShip(obj1));
    assert(!ObjectivesUtil.isShip(obj2));
});

it("isStructure", () => {
    const obj1 = new MockGameObject({ templateMetadata: "unit:base/pds" });
    const obj2 = new MockGameObject({ templateMetadata: "nope:nope/nope" });
    assert(ObjectivesUtil.isStructure(obj1));
    assert(!ObjectivesUtil.isStructure(obj2));
});

it("isUnit", () => {
    const obj1 = new MockGameObject({ templateMetadata: "unit:base/pds" });
    const obj2 = new MockGameObject({ templateMetadata: "nope:nope/nope" });
    assert(ObjectivesUtil.isUnit(obj1));
    assert(!ObjectivesUtil.isUnit(obj2));
});

it("isUnitUpgradeTechnology", () => {
    const obj1 = new MockGameObject({
        templateMetadata: "card.technology.unit_upgrade.sol:base/spec_ops_2",
    });
    const obj2 = new MockGameObject({ templateMetadata: "nope:nope/nope" });
    assert(ObjectivesUtil.isUnitUpgradeTechnology(obj1));
    assert(!ObjectivesUtil.isUnitUpgradeTechnology(obj2));
});
