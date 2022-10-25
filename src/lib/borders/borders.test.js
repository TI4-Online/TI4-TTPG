require("../../global"); // setup world.TI4
const assert = require("assert");
const { Borders, AREA } = require("./borders");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("getAllControlEntries", () => {
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 1,
    });
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 2,
    });
    const dreadnought = new MockGameObject({
        templateMetadata: "unit:base/dreadnought",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 3,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);
    world.__addObject(pds);
    world.__addObject(dreadnought);

    const controlEntries = Borders.getAllControlEntries();
    world.__clear;

    assert.equal(controlEntries.length, 3);
    assert.equal(controlEntries[0].obj, pds);
    assert.equal(controlEntries[0].hex, "<0,0,0>");
    assert.equal(controlEntries[0].playerSlot, 2);
    assert.equal(controlEntries[0].areaType, AREA.PLANET);
    assert(controlEntries[0].planet);

    assert.equal(controlEntries[1].obj, dreadnought);
    assert.equal(controlEntries[1].hex, "<0,0,0>");
    assert.equal(controlEntries[1].playerSlot, 3);
    assert.equal(controlEntries[1].areaType, AREA.SPACE);
    assert(!controlEntries[1].planet);

    assert.equal(controlEntries[2].obj, controlToken); // units found first
    assert.equal(controlEntries[2].hex, "<0,0,0>");
    assert.equal(controlEntries[2].playerSlot, 1);
    assert.equal(controlEntries[2].areaType, AREA.PLANET);
    assert(controlEntries[2].planet);
});

it("rewriteControlEntriesForTeams", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const slot1 = desks[1].playerSlot;
    const slot2 = desks[2].playerSlot;
    assert(slot2 < slot1); // team uses lowest slot
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: slot1,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);

    const controlEntries = Borders.getAllControlEntries();
    world.__clear;

    assert.equal(controlEntries.length, 1);
    assert.equal(controlEntries[0].obj, controlToken);
    assert.equal(controlEntries[0].hex, "<0,0,0>");
    assert.equal(controlEntries[0].playerSlot, slot1);
    assert.equal(controlEntries[0].areaType, AREA.PLANET);
    assert(controlEntries[0].planet);

    world.setSlotTeam(slot1, 13);
    world.setSlotTeam(slot2, 13);
    Borders.rewriteControlEntriesForTeams(controlEntries);

    assert.equal(controlEntries.length, 1);
    assert.equal(controlEntries[0].obj, controlToken);
    assert.equal(controlEntries[0].hex, "<0,0,0>");
    assert.equal(controlEntries[0].playerSlot, slot2); // team uses lowest slot
    assert.equal(controlEntries[0].areaType, AREA.PLANET);
    assert(controlEntries[0].planet);
});

it("getHexToControlSummary", () => {
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 1,
    });
    const pds = new MockGameObject({
        templateMetadata: "unit:base/pds",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 2,
    });
    const dreadnought = new MockGameObject({
        templateMetadata: "unit:base/dreadnought",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 3,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);
    world.__addObject(pds);
    world.__addObject(dreadnought);

    const controlEntries = Borders.getAllControlEntries();
    const hexToControlSummary = Borders.getHexToControlSummary(controlEntries);
    world.__clear;

    const summary = hexToControlSummary["<0,0,0>"];
    assert(summary);

    assert.equal(summary["space"], 3);
    assert.equal(summary[0], -1);
});

it("getSpaceLineSegments", () => {
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "unit:base/dreadnought",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 1,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);

    const controlEntries = Borders.getAllControlEntries();
    const hexToControlSummary = Borders.getHexToControlSummary(controlEntries);
    const lineSegments = Borders.getSpaceLineSegments(hexToControlSummary);
    world.__clear;

    assert.equal(lineSegments.length, 6);
    assert.equal(lineSegments[0].playerSlot, 1);
});

it("linkLineSegments", () => {
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "unit:base/dreadnought",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 1,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);

    const controlEntries = Borders.getAllControlEntries();
    const hexToControlSummary = Borders.getHexToControlSummary(controlEntries);
    const lineSegments = Borders.getSpaceLineSegments(hexToControlSummary);
    const linkedSegments = Borders.linkLineSegments(lineSegments);
    world.__clear;

    assert.equal(linkedSegments.length, 1);

    const line = linkedSegments[0].line;
    assert.equal(line.length, 7); // closed loop
    const d = line[0].subtract(line[6]).magnitudeSquared();
    assert(d < 0.1);
});
