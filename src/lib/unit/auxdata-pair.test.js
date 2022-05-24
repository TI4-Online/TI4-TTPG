require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { AuxDataPair } = require("./auxdata-pair");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockVector,
    world,
} = require("../../wrapper/api");
const { AuxDataBuilder } = require("./auxdata");
const { Hex } = require("../hex");

it("getPairSync", () => {
    world.__clear();

    const selfPlayerSlot = 7;
    const opponentPlayerSlot = 8;

    // Place a few units and tokens.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: selfPlayerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: opponentPlayerSlot,
            position: new MockVector(0.5, 0, 0), // further from tokens than above
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/fighter_3",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/infantry_1",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: selfPlayerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: opponentPlayerSlot,
        })
    );

    // Carrier 2
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.technology.unit_upgrade:base/carrier_2",
            }),
            owningPlayerSlot: selfPlayerSlot,
        })
    );

    // Morale boost!
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.action:base/morale_boost.3",
            }),
            owningPlayerSlot: selfPlayerSlot,
        })
    );

    // Opponent cancels our PDS planetary shield.
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.action:base/disable",
            }),
            owningPlayerSlot: opponentPlayerSlot,
        })
    );

    const aux1 = new AuxDataBuilder()
        .setPlayerSlot(selfPlayerSlot)
        .setHex("<0,0,0>")
        .build();
    const aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).disableModifierFiltering().fillPairSync();
    world.__clear();

    // Identified opponent?
    assert.equal(aux1.playerSlot, selfPlayerSlot);
    assert.equal(aux2.playerSlot, opponentPlayerSlot);

    // Basic finding.
    assert.equal(aux1.count("fighter"), 4);
    assert.equal(
        aux1.unitAttrsSet.get("carrier").raw.localeName,
        "unit.carrier_2"
    );

    const modifierNames = aux1.unitModifiers.map((x) => x.raw.localeName);
    assert.equal(modifierNames.length, 2);
    assert(modifierNames.includes("unit_modifier.name.morale_boost"));
    assert(modifierNames.includes("unit_modifier.name.disable"));

    assert.equal(aux2.count("fighter"), 1);

    // Verify self modifier.
    assert.equal(aux1.count("fighter"), 4);

    // Verify opponent's opponent modifier.
    assert(!aux1.unitAttrsSet.get("pds").raw.planetaryShield); // disabled
    assert(aux2.unitAttrsSet.get("pds").raw.planetaryShield); // opponent still has it
});

it("unknown opponent", () => {
    world.__clear();
    const selfPlayerSlot = 7;
    const aux1 = new AuxDataBuilder()
        .setPlayerSlot(selfPlayerSlot)
        .setHex("<0,0,0>")
        .build();
    const aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).fillPairSync();
    world.__clear();
    assert.equal(aux1.playerSlot, selfPlayerSlot);
    assert.equal(aux2.playerSlot, -1);
});

it("too many opponents", () => {
    world.__clear();

    const selfPlayerSlot = 7;
    const opponentPlayerSlot = 8;
    const otherPlayerSlot = 9;

    // Place a few units and tokens.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: selfPlayerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: opponentPlayerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: otherPlayerSlot,
        })
    );

    const aux1 = new AuxDataBuilder()
        .setPlayerSlot(selfPlayerSlot)
        .setHex("<0,0,0>")
        .build();
    const aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).fillPairSync();
    world.__clear();

    // Cannot identify opponent when more than one to choose from.
    assert.equal(aux1.playerSlot, selfPlayerSlot);
    assert.equal(aux2.playerSlot, -1);
});

it("filtering", () => {
    world.__clear();

    const selfPlayerSlot = 7;

    // Place a few units and tokens.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/fighter",
            owningPlayerSlot: selfPlayerSlot,
        })
    );

    // Morale boost!
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.action:base/morale_boost.3",
            }),
            owningPlayerSlot: selfPlayerSlot,
        })
    );

    // Verify finds modifier when filtering disabled.
    let aux1 = new AuxDataBuilder().setPlayerSlot(selfPlayerSlot).build();
    let aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).disableModifierFiltering().fillPairSync();
    let modifierNames = aux1.unitModifiers.map((x) => x.raw.localeName);
    assert.equal(modifierNames.length, 1);
    assert(modifierNames.includes("unit_modifier.name.morale_boost"));

    // Enable filtering, without specifying rollType (needed to apply).
    aux1 = new AuxDataBuilder().setPlayerSlot(selfPlayerSlot).build();
    aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).fillPairSync();
    modifierNames = aux1.unitModifiers.map((x) => x.raw.localeName);
    assert.equal(modifierNames.length, 0);

    // Enable filtering, specify spaceCombat.
    aux1 = new AuxDataBuilder()
        .setPlayerSlot(selfPlayerSlot)
        .setRollType("spaceCombat")
        .build();
    aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).fillPairSync();
    modifierNames = aux1.unitModifiers.map((x) => x.raw.localeName);
    assert.equal(modifierNames.length, 1);
    assert(modifierNames.includes("unit_modifier.name.morale_boost"));

    world.__clear();
});

it("pds 2", () => {
    world.__clear();

    const desk = world.TI4.getAllPlayerDesks()[0];

    // Place pds2 and system tile.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: desk.playerSlot,
            position: Hex.toPosition("<1,0,-1>"), // adjacent
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/28",
            position: Hex.toPosition("<1,0,-1>"), // adjacent
        })
    );

    // Unit upgrade.
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.technology.unit_upgrade:base/pds_2",
            }),
            position: desk.center,
        })
    );

    const aux1 = new AuxDataBuilder()
        .setPlayerSlot(desk.playerSlot)
        .setHex("<0,0,0>")
        .setRollType("spaceCannon")
        .build();
    const aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).disableModifierFiltering().fillPairSync();
    world.__clear();

    assert.equal(aux1.playerSlot, desk.playerSlot);
    assert.equal(aux2.playerSlot, -1);

    // Found the unit upgrade.
    assert.equal(aux1.unitAttrsSet.get("pds").raw.spaceCannon.range, 1);

    // Found the adjacent unit.
    assert.equal(aux1.adjacentCount("pds"), 1);
});

it("hel titan 2", () => {
    world.__clear();

    const desk = world.TI4.getAllPlayerDesks()[0];

    // Place pds2 and system tile.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: desk.playerSlot,
            position: Hex.toPosition("<1,0,-1>"), // adjacent
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/28",
            position: Hex.toPosition("<1,0,-1>"), // adjacent
        })
    );

    // Unit upgrade.
    world.__addObject(
        new MockCard({
            cardDetails: new MockCardDetails({
                metadata: "card.technology.unit_upgrade.ul:pok/heltitan_2",
            }),
            position: desk.center,
        })
    );

    const aux1 = new AuxDataBuilder()
        .setPlayerSlot(desk.playerSlot)
        .setHex("<0,0,0>")
        .setRollType("spaceCannon")
        .build();
    const aux2 = new AuxDataBuilder().build();
    new AuxDataPair(aux1, aux2).disableModifierFiltering().fillPairSync();
    world.__clear();

    assert.equal(aux1.playerSlot, desk.playerSlot);
    assert.equal(aux2.playerSlot, -1);

    // Found the unit upgrade.
    assert.equal(aux1.unitAttrsSet.get("pds").raw.spaceCannon.range, 1);

    // Found the adjacent unit.
    assert.equal(aux1.adjacentCount("pds"), 1);
});
