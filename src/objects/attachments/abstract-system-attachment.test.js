require("../../global"); // register world.TI4
const assert = require("assert");
const { AbstractSystemAttachment } = require("./abstract-system-attachment");
const {
    MockGameObject,
    MockPlayer,
    MockVector,
    globalEvents,
    world,
} = require("../../wrapper/api");

// Minimal planet-based attachment: place at origin, record attached/removed.
class TestSystemAttachment extends AbstractSystemAttachment {
    constructor() {
        const gameObject = new MockGameObject({
            position: new MockVector(0, 0, 0),
        });
        const isPlanetBased = true;
        const localeName = "n/a";
        super(gameObject, isPlanetBased, localeName);
        this.gameObject = gameObject;
        this.placeHistory = [];
        this.removeHistory = [];
    }
    place(system, planet) {
        this.placeHistory.push({
            system,
            planet,
        });
    }
    remove(system, planet) {
        this.removeHistory.push({
            system,
            planet,
        });
    }
}

const _onSystemChangedHistory = [];

globalEvents.TI4.onSystemChanged.add((systemTileObj) => {
    _onSystemChangedHistory.push(systemTileObj);
});

it("constructor", () => {
    new TestSystemAttachment();
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

    // Does not attach in constructor.
    const att = new TestSystemAttachment();
    assert.equal(att.placeHistory.length, 0);
    assert.equal(att.removeHistory.length, 0);
    assert.equal(_onSystemChangedHistory.length, 0);

    // Attach.
    //att.gameObject.onReleased.trigger(att.gameObject, player);
    att._place(); // onReleased has a workaround right now
    assert.equal(att.placeHistory.length, 1);
    assert.deepEqual(att.placeHistory[0], { system, planet });
    assert.equal(att.removeHistory.length, 0);
    assert.equal(_onSystemChangedHistory.length, 1);
    assert.deepEqual(_onSystemChangedHistory, [systemTileObj]);

    // "Attach" again, aborts because already attached there.
    att.gameObject.onReleased.trigger(att.gameObject, player);
    assert.equal(att.placeHistory.length, 1);
    assert.equal(att.removeHistory.length, 0);
    assert.equal(_onSystemChangedHistory.length, 1);

    // Detach.
    att.gameObject.onGrab.trigger(att.gameObject, player);
    assert.equal(att.placeHistory.length, 1);
    assert.equal(att.removeHistory.length, 1);
    assert.deepEqual(att.removeHistory[0], { system, planet });
    assert.equal(_onSystemChangedHistory.length, 2);
    assert.deepEqual(_onSystemChangedHistory, [systemTileObj, systemTileObj]);

    world.__clear();
});
