const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { System, Planet } = require("../../lib/system/system");
const { refObject, GameObject, Rotator, Vector } = require("../../wrapper/api");
const { Explore } = require("../../lib/explore/explore");

const MIRAGE_ATTRS = {
    localeName: "planet.mirage",
    resources: 1,
    influence: 2,
    trait: ["cultural"],
    position: { x: 2, y: -1.25 },
    radius: 2,
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
        const planetPos = { x: 0, y: 0 }; // use ATTRS
        const planetRadius = 0; // use ATTRS
        const mirage = new Planet(
            MIRAGE_ATTRS,
            system,
            planetIndex,
            planetPos,
            planetRadius
        );
        system.planets.push(mirage);
        System.invalidatePlanetNameCache();

        // Make sure card is registered.
        assert(Planet.getByCardNsid("card.planet:pok/mirage"));

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

        const tokenObj = this.getAttachTokenObj();
        miragePos.z += systemTileObj.getSize().z * tokenObj.getSize().z;

        // Watch out for place re-triggering onMovementStopped, ignore if already
        // at location.
        const p = tokenObj.getPosition();
        const dx = p.x - miragePos.x;
        const dy = p.y - miragePos.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < 0.1) {
            return;
        }

        tokenObj.setScale(scale);
        Explore.reserveTokenSpaceAndAnchorToken(tokenObj, miragePos, mirageRot);
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

process.nextTick(() => {
    new Mirage(refObject);
});
