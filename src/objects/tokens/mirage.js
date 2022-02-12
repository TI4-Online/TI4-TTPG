const { refObject, Rotator } = require("../../wrapper/api");
const { System, Planet } = require("../../lib/system/system");
const { Broadcast } = require("../../lib/broadcast");

const MIRAGE_ATTRS = {
    localeName: "planet.mirage",
    resources: 1,
    influence: 2,
    trait: ["cultural"],
    position: { x: 2, y: -1.25 },
    legendary: true,
    legendaryCard: "card.legendary_planet:pok/mirage_flight_academy",
};

// track the system mirage is in so we don't have to go searching for it
let _mirageSystemTileNumber = 0;

function detachMirage() {
    if (_mirageSystemTileNumber) {
        const prevMirageSystem = System.getByTileNumber(
            _mirageSystemTileNumber
        );
        console.log("Detaching mirage from", _mirageSystemTileNumber);

        // mirage only goes in 0 planet systems so removing the first
        // planet will remove mirage
        prevMirageSystem.planets.splice(0, 1);
        _mirageSystemTileNumber = 0;
    }
}

function attachMirage(obj) {
    const pos = obj.getPosition();
    const systemObj = System.getSystemTileObjectByPosition(pos);
    if (systemObj) {
        // if mirage was already attached somewhere else, detach it first
        // before attaching to the new system
        detachMirage();

        const system = System.getBySystemTileObject(systemObj);

        // check that the system is a valid target for mirage
        if (system.planets.length > 0) {
            Broadcast.chatAll(
                "Mirage must be attached to a system with 0 planets."
            );
            return;
        }

        // attach mirage to the system
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
        _mirageSystemTileNumber = system.tile;
    }
}

refObject.onReleased.add(attachMirage);
refObject.onGrab.add(detachMirage);
