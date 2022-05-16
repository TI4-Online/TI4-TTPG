require("../../global"); // setup world.TI4
const assert = require("assert");
const { FogOfWar } = require("./fog-of-war");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("update", () => {
    const systemObj = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });
    const controlToken = new MockGameObject({
        templateMetadata: "token.control:base/arborec",
        position: new MockVector(0, 0, 0),
        owningPlayerSlot: 1,
    });

    world.__clear();
    world.__addObject(systemObj);
    world.__addObject(controlToken);

    const fogOfWar = new FogOfWar();
    fogOfWar.enable();
    fogOfWar.setViewAs(2, 1);
    const hexToOwners = fogOfWar.update();
    world.__clear;

    const owners = hexToOwners["<0,0,0>"];
    assert(owners);
    assert.equal(owners.size, 2);
    assert(owners.has(1)); // control token
    assert(owners.has(2)); // spectator
});
