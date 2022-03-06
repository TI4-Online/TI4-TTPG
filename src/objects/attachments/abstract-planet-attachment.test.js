require("../../global"); // register world.TI4
const assert = require("assert");
const { AbstractPlanetAttachment } = require("./abstract-planet-attachment");
const {
    MockGameObject,
    MockPlayer,
    MockVector,
    globalEvents,
    world,
} = require("../../wrapper/api");

let _onSystemChangedHistory = [];

globalEvents.TI4.onSystemChanged.add((systemTileObj) => {
    _onSystemChangedHistory.push(systemTileObj);
});

it("constructor", () => {
    const gameObject = new MockGameObject();
    const attrs = {};
    const localeName = "n/a";
    new AbstractPlanetAttachment(gameObject, attrs, localeName);
});

it("attach/detach", () => {
    const systemTileObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    const planet = system.planets[0];
    const player = new MockPlayer();

    world.__clear();
    world.__addObject(systemTileObj);
    _onSystemChangedHistory = [];

    const tokenObj = new MockGameObject();
    const attrs = {
        faceUp: { resources: 1, influence: 2 },
    };
    const localeName = "n/a";
    const att = new AbstractPlanetAttachment(tokenObj, attrs, localeName);

    assert.equal(_onSystemChangedHistory.length, 0);
    assert.equal(planet.raw.resources, 1);
    assert.equal(planet.raw.influence, 6);

    // Attach.
    att.attachIfOnSystem();
    assert.equal(_onSystemChangedHistory.length, 1);
    assert.equal(planet.raw.resources, 2);
    assert.equal(planet.raw.influence, 8);

    // "Attach" again, aborts because already attached there.
    tokenObj.onReleased.trigger(att.gameObject, player);
    assert.equal(_onSystemChangedHistory.length, 1);
    assert.equal(planet.raw.resources, 2);
    assert.equal(planet.raw.influence, 8);

    // Detach.
    tokenObj.onGrab.trigger(att.gameObject, player);
    assert.equal(_onSystemChangedHistory.length, 2);
    assert.equal(planet.raw.resources, 1);
    assert.equal(planet.raw.influence, 6);

    world.__clear();
});

it("known token", () => {
    const systemTileObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    const planet = system.planets[0];
    const player = new MockPlayer();

    world.__clear();
    world.__addObject(systemTileObj);
    _onSystemChangedHistory = [];

    // 1r 2i token
    const tokenObj = new MockGameObject({
        templateMetadata: "token.attachment.exploration:pok/lazax_survivors",
    });
    const att =
        AbstractPlanetAttachment.createForKnownAttachmentToken(tokenObj);

    // This style attaches in constructor.
    assert.equal(_onSystemChangedHistory.length, 1);
    assert.equal(planet.raw.resources, 2);
    assert.equal(planet.raw.influence, 8);

    // "Attach" again, aborts because already attached there.
    tokenObj.onReleased.trigger(att.gameObject, player);
    assert.equal(_onSystemChangedHistory.length, 1);
    assert.equal(planet.raw.resources, 2);
    assert.equal(planet.raw.influence, 8);

    // Detach.
    tokenObj.onGrab.trigger(att.gameObject, player);
    assert.equal(_onSystemChangedHistory.length, 2);
    assert.equal(planet.raw.resources, 1);
    assert.equal(planet.raw.influence, 6);

    world.__clear();
});
