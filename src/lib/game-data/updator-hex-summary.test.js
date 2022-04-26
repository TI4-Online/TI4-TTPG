require("../../global"); // register world.TI4
const assert = require("assert");
const updator = require("./updator-hex-summary");
const { MockGameObject, MockRotator, world } = require("../../wrapper/api");

it("hexSummmary empty", () => {
    world.__clear();
    const data = {};
    updator(data);
    assert.equal(data.hexSummary, "");
    world.__clear();
});

it("hexSummmary busy", () => {
    world.TI4.reset();
    world.__clear();

    const data = {};
    const desk1 = world.TI4.getAllPlayerDesks()[0];
    const desk2 = world.TI4.getAllPlayerDesks()[1];

    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.system:base/19",
        })
    );

    // Command, control token.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/sol",
            owningPlayerSlot: desk1.playerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.control:base/sol",
            owningPlayerSlot: desk1.playerSlot,
        })
    );

    // 1 dread, 1 infantry, 2 pds.
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/dreadnought",
            owningPlayerSlot: desk2.playerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/infantry",
            owningPlayerSlot: desk2.playerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: desk2.playerSlot,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "unit:base/pds",
            owningPlayerSlot: desk2.playerSlot,
        })
    );

    // Frontier token in space (not legal, but should encode)
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:pok/frontier",
        })
    );

    // Planet tokens, one flipped.
    world.__addObject(
        new MockGameObject({
            templateMetadata:
                "token.attachment.exploration:pok/biotic_facility",
            rotation: new MockRotator(0, 0, 0),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata:
                "token.attachment.exploration:pok/cybernetic_facility",
            rotation: new MockRotator(0, 0, 180),
        })
    );
    updator(data);
    world.__clear();

    assert.equal(data.hexSummary, "19+0+0BdWt*e;Bi2pWo*Ci");
});
