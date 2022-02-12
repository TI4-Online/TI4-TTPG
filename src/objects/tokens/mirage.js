const { refObject, Rotator } = require("../../wrapper/api");
const { System, Planet } = require("../../lib/system/system");
const { Broadcast } = require("../../lib/broadcast");
const Vector = require("../../mock/mock-vector");

const MIRAGE_ATTRS = {
    localeName: "planet.mirage",
    resources: 1,
    influence: 2,
    trait: ["cultural"],
    position: { x: 2, y: -1.25 },
    radius: 1.75,
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
        _mirageSystemTileNumber = system.tile;

        // place and lock the mirage token in the right location

        // shift the yaw so that the token text is upright in the system
        const systemRot = systemObj.getRotation();
        const mirageRot = new Rotator(
            systemRot.pitch,
            systemRot.yaw - 110,
            systemRot.roll
        );

        // shift the position down slightly to account for the planet label
        const scale = systemObj.getScale();
        const shiftedMiragePos = new Vector(
            mirage.position.x - 0.2 * scale.x,
            mirage.position.y,
            mirage.position.z
        );
        const miragePos = systemObj.localPositionToWorld(shiftedMiragePos);

        obj.setPosition(miragePos);
        obj.setRotation(mirageRot);
        obj.setScale(scale);
        obj.toggleLock();
    }
}

refObject.onReleased.add(attachMirage);
refObject.onGrab.add(detachMirage);
