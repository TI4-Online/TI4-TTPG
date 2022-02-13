const assert = require("assert");
const PositionToPlanet = require("./position-to-planet");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("getClosestPlanet", () => {
    world.__clear();
    const systemObject = new MockGameObject({
        templateMetadata: "tile.system:base/18",
        position: new MockVector(0, 0, 0),
    });

    world.__addObject(systemObject);
    const pos = new MockVector(0, 0, 0);
    const planet = PositionToPlanet.getClosestPlanet(pos, systemObject, false);
    assert.equal(planet.localeName, "planet.mecatol_rex");
});
