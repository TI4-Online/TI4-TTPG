const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { Planet } = require("../../lib/system/system");
const {
    refObject,
    GameObject,
    ObjectType,
    Rotator,
    Vector,
} = require("../../wrapper/api");

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

class Mirage extends AbstractSystemAttachment {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        const isPlanetBased = false;
        const localeName = "planet.mirage";
        super(gameObject, isPlanetBased, localeName);
        this.attachIfOnSystem();
    }

    allow(system, planet, systemTileObj) {
        return system.planets.length === 0 && !system.hyperlane;
    }

    place(system, planet, systemTileObj) {
        const planetIndex = 0;
        const planetPos = { x: -2, y: 1 };
        const planetRadius = 2;
        const mirage = new Planet(
            MIRAGE_ATTRS,
            system,
            planetIndex,
            planetPos,
            planetRadius
        );
        system.planets.push(mirage);

        // place and lock the mirage token in the right location

        // shift the yaw so that the token text is upright in the system
        const systemRot = systemTileObj.getRotation();
        const mirageRot = systemRot.compose(new Rotator(0, -110, 0));

        // shift the position down slightly to account for the planet label
        const scale = systemTileObj.getScale();
        const shiftedMiragePos = new Vector(
            mirage.position.x - 0.2 * scale.x,
            mirage.position.y,
            mirage.position.z
        );
        const miragePos = systemTileObj.localPositionToWorld(shiftedMiragePos);

        // offset position in the z direction to ensure that the mirage is always
        // on top of the system tile, otherwise it sometimes appears partially
        // underneath the tile
        const tokenObj = this.getAttachTokenObj();
        tokenObj.setObjectType(ObjectType.Regular); // paranoia
        tokenObj.setPosition(
            miragePos.add(new Vector(0, 0, systemTileObj.getSize().z))
        );
        tokenObj.setRotation(mirageRot);
        tokenObj.setScale(scale);

        // convert to a "ground" object so that it cant be moved
        // using toggleLock() causes the token to be unlocked when coming
        // back from a script reload
        tokenObj.setObjectType(ObjectType.Ground);
    }

    remove(system, planet, systemTileObj) {
        // mirage only goes in 0 planet systems so removing the first planet
        // will remove mirage
        if (system.planets.length === 0) {
            return; // something is wrong, abort
        }
        assert(system.planets[0].raw.localeName === "planet.mirage");
        system.planets.splice(0, 1);
    }
}

new Mirage(refObject);
