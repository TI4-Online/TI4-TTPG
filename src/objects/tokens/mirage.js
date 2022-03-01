const { refObject, world, Rotator, Vector } = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const { Planet } = require("../../lib/system/system");
const assert = require("../../wrapper/assert-wrapper");

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
        const prevMirageSystem = world.TI4.getSystemByTileNumber(
            _mirageSystemTileNumber
        );

        // mirage only goes in 0 planet systems so removing the first planet
        // will remove mirage
        assert(prevMirageSystem.planets[0].raw.localeName === "planet.mirage");
        prevMirageSystem.planets.splice(0, 1);
        _mirageSystemTileNumber = 0;
    }
}

function attachMirage(obj) {
    const pos = obj.getPosition();
    const systemObj = world.TI4.getSystemTileObjectByPosition(pos);
    if (systemObj) {
        // if mirage was already attached somewhere else, detach it first
        // before attaching to the new system
        detachMirage();

        const system = world.TI4.getSystemBySystemTileObject(systemObj);

        // check that the system is a valid target for mirage
        if (system.planets.length > 0) {
            Broadcast.chatAll(
                "Mirage must be attached to a system with 0 planets."
            );
            return;
        }

        // attach mirage to the system
        const mirage = new Planet(MIRAGE_ATTRS, system);
        system.planets.push(mirage);
        _mirageSystemTileNumber = system.tile;

        // place and lock the mirage token in the right location

        // shift the yaw so that the token text is upright in the system
        const systemRot = systemObj.getRotation();
        const mirageRot = systemRot.compose(new Rotator(0, -110, 0));

        // shift the position down slightly to account for the planet label
        const scale = systemObj.getScale();
        const shiftedMiragePos = new Vector(
            mirage.position.x - 0.2 * scale.x,
            mirage.position.y,
            mirage.position.z
        );
        const miragePos = systemObj.localPositionToWorld(shiftedMiragePos);

        // offset position in the z direction to ensure that the mirage is always
        // on top of the system tile, otherwise it sometimes appears partially
        // underneath the tile
        obj.setPosition(miragePos.add(new Vector(0, 0, systemObj.getSize().z)));
        obj.setRotation(mirageRot);
        obj.setScale(scale);

        // convert to a "ground" object so that it cant be moved
        // using toggleLock() causes the token to be unlocked when coming
        // back from a script reload
        obj.setObjectType(1);
    }
}

refObject.onReleased.add(attachMirage);
refObject.onGrab.add(detachMirage);
refObject.onCreated.add(attachMirage);

if (world.getExecutionReason() === "ScriptReload") {
    attachMirage(refObject);
}

// Outsiders can call obj.__attachment.attach()
refObject.__attachment = {
    attach: () => {
        attachMirage(refObject);
    },
};
