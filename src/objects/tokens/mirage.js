const { refObject, Rotator } = require("../../wrapper/api");
const { System, Planet } = require("../../lib/system/system");

const MIRAGE_ATTRS = {
    localeName: "planet.mirage",
    resources: 1,
    influence: 2,
    trait: ["cultural"],
    position: { x: 2, y: -1.25 },
    legendary: true,
    legendaryCard: "card.legendary_planet:pok/mirage_flight_academy",
};
let MIRAGE_SYSTEM = 0;

function attachMirage(obj) {
    const pos = obj.getPosition();
    const systemObj = System.getSystemTileObjectByPosition(pos);
    if (systemObj) {
        const system = System.getBySystemTileObject(systemObj);
        if (MIRAGE_SYSTEM) {
            const prevMirageSystem = System.getByTileNumber(MIRAGE_SYSTEM);
            console.log("Detaching mirage from", MIRAGE_SYSTEM);
            // mirage can only go in 0 planet systems
            prevMirageSystem.planets.splice(0, 1);
            MIRAGE_SYSTEM = 0;
        }
        if (system.planets.length === 0) {
            console.log("Attaching mirage to", system.tile);
            const mirage = new Planet(MIRAGE_ATTRS, system);
            system.planets.push(mirage);
            const systemRot = systemObj.getRotation();
            const mirageRot = new Rotator(
                systemRot.pitch,
                systemRot.yaw - 100,
                systemRot.roll
            );
            obj.setPosition(systemObj.localPositionToWorld(mirage.position));
            obj.setRotation(mirageRot);
            obj.setScale(systemObj.getScale());
            obj.toggleLock();
            MIRAGE_SYSTEM = system.tile;
        } else {
            console.log("Mirage must be attached to a system with 0 planets");
        }
    }
}

refObject.onReleased.add(attachMirage);
