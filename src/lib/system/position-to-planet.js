const { Hex } = require("../hex");
const { Facing } = require("../facing");
const { Color, Vector, world } = require("../../wrapper/api");

// TODO: better Clan of Saar home system

// constants used to draw debug spheres
const DEBUG_COLOR = new Color(1, 0, 1);
const DEBUG_DURATION = 10;
const DEBUG_THICKNESS = 0.1;
const TILE_HEIGHT = 0.253;

// increase this to make determing if a position is on a planet more lenient
// decrease it to make the check more strict
const RADIUS_BUFFER = 0.0;

/**
 * Returns an array of the x, y position and radius of each planet in the
 * given system.
 *
 * @param {System} system
 * @returns {[{position: {x: number, y: number}, radius: number}]}
 */
function getPlanetHelper(system) {
    if (system.planets) {
        return system.planets.map((planet) => {
            return { position: planet.position, radius: planet.radius };
        });
    } else {
        return [];
    }
}

/**
 *  Draws a debug sphere centered at (x, y, table height) with radius r.
 *
 * @param {{x: Number, y: Number, r: Number}} planetPos
 */
function drawSphereAroundPlanet(planetPos, planetRadius) {
    const pos = new Vector(
        planetPos.x,
        planetPos.y,
        world.getTableHeight() + TILE_HEIGHT
    );
    world.drawDebugSphere(
        pos,
        planetRadius,
        DEBUG_COLOR,
        DEBUG_DURATION,
        DEBUG_THICKNESS
    );
}

/**
 * Returns the System, if any, that pos is over top of. Also returns the
 * GameObject for the system tile.
 *
 * @param {Vector} pos
 * @param {GameObject} systemObject - optional, will find if omitted
 * @returns {{system: System, obj: GameObject }}
 */
function getSystem(pos, systemObject) {
    const obj = systemObject || world.TI4.getSystemTileObjectByPosition(pos);
    if (obj) {
        const system = world.TI4.getSystemBySystemTileObject(obj);
        return {
            system,
            obj,
        };
    }
}

/**
 * Returns the distance between src and dest.
 *
 * Not using the TTPG built in Vector distance because we don't care about the
 * Z dimension.
 *
 * @param {{x: number, y: number}} src
 * @param {{x: number, y: number}} dest
 * @returns {number}
 */
function distance(src, dest) {
    return Math.sqrt(Math.pow(src.x - dest.x, 2) + Math.pow(src.y - dest.y, 2));
}

/**
 * Returns true if point lies inside a circle defined by center and radius.
 * With a tolerance of RADIUS_BUFFER
 *
 * Not using TTPG built in Vector distance because we don't care about the
 * Z dimension.
 *
 * @param {{x: number, y: number}} center
 * @param {number} radius
 * @param {{x: number, y: number}} point
 * @returns {number}
 */
function withinCircle(center, radius, point) {
    return distance(center, point) <= radius + RADIUS_BUFFER;
}

/**
 * Converts world position of pos to local position relative to obj.
 *
 * If obj is flipped upsidedown, the y dimension is negated after
 * calling worldPositionToLocal
 *
 * @param {GameObject} obj
 * @param {Vector} pos
 * @returns {Vector}
 */
function getLocalPosition(obj, pos) {
    const localPosition = obj.worldPositionToLocal(pos);
    if (Facing.isFaceUp(obj)) {
        return localPosition;
    } else {
        const correctedPosition = new Vector(
            localPosition.x,
            localPosition.y * -1,
            localPosition.z
        );
        return correctedPosition;
    }
}

/**
 * Converts the local position of pos relative to obj to a world position.
 *
 * If obj is flipped upsidedown, the y dimension is negated before calling
 * localPositionToWorld
 *
 * @param {GameObject} obj
 * @param {Vector} pos
 * @returns {Vector}
 */
function getWorldPosition(obj, pos) {
    if (Facing.isFaceUp(obj)) {
        return obj.localPositionToWorld(pos);
    } else {
        const correctedPosition = new Vector(pos.x, pos.y * -1, pos.z);
        return obj.localPositionToWorld(correctedPosition);
    }
}

/**
 * Returns the closest Planet to pos, if pos is over a sytem tile.
 *
 * If debug is true, a sphere is drawn around the closest planet.
 *
 * @param {Vector} pos
 * @param {GameObject} systemObject - optional, will find if omitted
 * @param {boolean} debug
 * @returns {Planet}
 */
function getClosestPlanet(pos, systemObject, debug) {
    const system = getSystem(pos, systemObject);
    if (system && system.system.planets && system.system.planets.length > 0) {
        const localPos = getLocalPosition(system.obj, pos);
        const planetPositions = getPlanetHelper(system.system);
        const planets = system.system.planets;

        const distances = planetPositions.map((element, index) => {
            return distance(element.position, localPos);
        });
        const closestPlanetIndex = distances.indexOf(Math.min(...distances));

        if (debug) {
            const closest = planetPositions[closestPlanetIndex];
            const worldPos = getWorldPosition(system.obj, closest.position);

            // convert the planet radius to world
            const radius = (RADIUS_BUFFER + closest.radius) * Hex.SCALE;
            drawSphereAroundPlanet(worldPos, radius);
        }

        return planets[closestPlanetIndex];
    }
}

/**
 * Returns the planet, if any, that pos is directly over top of.
 *
 * If debug is true, a sphere is drawn around the planet.
 *
 * @param {Vector} pos
 * @param {GameObject} systemObject - optional, will find if omitted
 * @param {boolean} debug
 * @returns {Planet}
 */
function getExactPlanet(pos, systemObject, debug) {
    const system = getSystem(pos, systemObject);
    if (system && system.system.planets.length > 0) {
        const localPos = getLocalPosition(system.obj, pos);
        const planetPositions = getPlanetHelper(system.system);
        const planets = system.system.planets;

        const onPlanet = planetPositions
            .map((element, index) =>
                withinCircle(element.position, element.radius, localPos)
            )
            .indexOf(true);

        if (onPlanet > -1) {
            if (debug) {
                const planet = planetPositions[onPlanet];
                const worldPos = getWorldPosition(system.obj, planet.position);

                // convert the planet radius to world position
                const radius = (RADIUS_BUFFER + planet.radius) * Hex.SCALE;
                drawSphereAroundPlanet(worldPos, radius);
            }
            return planets[onPlanet];
        }
    }
}

module.exports = { getClosestPlanet, getExactPlanet, getWorldPosition };
