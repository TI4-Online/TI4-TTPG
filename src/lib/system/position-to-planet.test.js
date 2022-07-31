require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const PositionToPlanet = require("./position-to-planet");
const SYSTEM_ATTRS = require("./system.data");
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
    world.__clear();
    assert.equal(planet.localeName, "planet.mecatol_rex");
});

it("check all planets", () => {
    for (const raw of SYSTEM_ATTRS) {
        const tile = raw.tile;
        const system = world.TI4.getSystemByTileNumber(tile);
        assert(system.tile === tile);
        world.__clear();
        const systemObject = new MockGameObject({
            templateMetadata: `tile.system:base/${tile}`,
            position: new MockVector(0, 0, 0),
        });
        for (const planet of system.planets) {
            const pos = systemObject.localPositionToWorld(planet.position);
            const planet2 = PositionToPlanet.getClosestPlanet(
                pos,
                systemObject,
                false
            );
            if (planet !== planet2) {
                throw new Error(
                    `mismatch ${tile} "${planet.getNameStr()}" vs "${planet2.getNameStr()}"`
                );
            }
            assert(planet === planet2);
        }
    }
    world.__clear();
});
