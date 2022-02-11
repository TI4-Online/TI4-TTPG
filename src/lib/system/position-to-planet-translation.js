const { System } = require("./system");
const { ObjectNamespace } = require("../object-namespace");
const { Vector, world, Color } = require("@tabletop-playground/api");
const SYSTEM_ATTRS = require("./system.data");
const { Hex } = require("../hex");
const { Facing } = require("../facing");

// TODO: mirage
// TODO: better Clan of Saar home system

// constants used to draw debug spheres
const DEBUG_COLOR = new Color(255, 0, 255);
const DEBUG_DURATION = 10;
const DEBUG_THICKNESS = 0.1;
const TILE_HEIGHT = 0.253;

// increase this to make determing if a position is on a planet more lenient
// decrease it to make the check more strict
const RADIUS_BUFFER = 0.0;

function getPlanetHelper(system) {
    const tile = system.tile;
    const planetCount = system.planets.length;
    const home = system.raw.home;
    if (tile === 11) {
        // Clan of Saar Home System
        return [
            { x: 2, y: -1.25, r: 1.75 },
            { x: -1.8, y: 1.75, r: 1.75 },
        ];
    } else if (tile === 16) {
        // Hacan Home System
        return [
            { x: 0.5, y: -2.75, r: 2 },
            { x: 2.3, y: 1.3, r: 2 },
            { x: -2.4, y: 1.9, r: 2 },
        ];
    } else if (tile === 18) {
        // Mecatol Rex
        return [{ x: 0, y: 0, r: 4 }];
    } else if (tile === 51) {
        // Creuss Home System
        return [{ x: 1, y: 0, r: 2 }];
    } else if (tile === 55) {
        // Elysium Titans Home System
        return [{ x: 0.75, y: 0, r: 3.25 }];
    } else if (tile === 58) {
        // Argent Home System
        return [
            { x: 0.5, y: -2.75, r: 2 },
            { x: 2.3, y: 1.3, r: 2 },
            { x: -2.5, y: 1.7, r: 2 },
        ];
    } else if (tile === 65 || tile === 66) {
        // Hope's End or Primor
        return [{ x: 0, y: 0, r: 3.25 }];
    } else if (tile === 67) {
        // Cormund
        return [{ x: 0.7, y: -1, r: 2 }];
    } else if (tile === 68) {
        // Everra
        return [{ x: 0.5, y: -1, r: 2 }];
    } else if (tile === 82) {
        // Malice
        return [{ x: 1.2, y: 1, r: 2 }];
    } else if (tile === 25 || tile === 26 || tile == 64) {
        // standard one planet systems with starting wormhole
        return [{ x: 2, y: -1.25, r: 2 }];
    } else if (home && planetCount === 1) {
        return [{ x: 0.65, y: 0, r: 2 }];
    } else if (!home && planetCount === 1) {
        return [{ x: 0, y: 0, r: 2 }];
    } else if (home && planetCount === 2) {
        return [
            { x: 2, y: -1.25, r: 2 },
            { x: -1.8, y: 1.9, r: 2 },
        ];
    } else if (!home && planetCount === 2) {
        return [
            { x: 2, y: -1.25, r: 2 },
            { x: -2, y: 1, r: 2 },
        ];
    } else if (planetCount === 3) {
        return [
            { x: 0.5, y: -3, r: 2 },
            { x: 2, y: 1.5, r: 2 },
            { x: -2.7, y: 1.65, r: 2 },
        ];
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
 * Returns the System, if any, that pos is over top of along with the
 * local position of pos relative to the System.
 *
 * @param {Vector} pos
 * @returns {{system: System, localPos: Vector}}
 */
function getSystem(pos) {
    const dst = new Vector(pos.x, pos.y, world.getTableHeight() - 5);
    const hits = world.lineTrace(pos, dst);
    for (const hit of hits) {
        if (ObjectNamespace.isSystemTile(hit.object)) {
            const parsedSystem = ObjectNamespace.parseSystemTile(hit.object);
            const pos = hit.object.getPosition();
            return {
                system: System.getByTileNumber(parsedSystem.tile),
                obj: hit.object,
            };
        }
    }
}

/**
 * Returns the distance between src and dest.
 *
 * Not using the TTPG built in Vector distance because we don't care about the
 * Z dimension.
 *
 * @param {{x: Number, y: Number}} src
 * @param {{x: Number, y: Number}} dest
 * @returns {Number}
 */
function distance(src, dest) {
    return Math.sqrt(Math.pow(src.x - dest.x, 2) + Math.pow(src.y - dest.y, 2));
}

/**
 * Returns true if point lies inside a circle.
 * With a tolerance of RADIUS_BUFFER
 *
 * Not using TTPG built in Vector distance because we don't care about the
 * Z dimension.
 *
 * @param {{x: Number, y: Number, r: Number}} circle
 * @param {{x: Number, y: Number}} point
 * @returns {Number}
 */
function withinCircle(circle, point) {
    return distance(circle, point) <= circle.r + RADIUS_BUFFER;
}

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

function getWorldPosition(obj, pos) {
    if (Facing.isFaceUp(obj)) {
        return obj.localPositionToWorld(pos);
    } else {
        const correctedPosition = new Vector(pos.x, pos.y * -1, pos.z);
        return obj.localPositionToWorld(correctedPosition);
    }
}

function getClosestPlanet(pos, debug) {
    const system = getSystem(pos);
    if (system && system.system.planets.length > 0) {
        const localPos = getLocalPosition(system.obj, pos);
        const planetPositions = getPlanetHelper(system.system);
        const planets = system.system.planets;

        const distances = planetPositions.map((element, index) => {
            if (!planets[index].destroyed) {
                return distance(element, localPos);
            } else {
                return 1e4;
            }
        });

        const closestPlanetIndex = distances.indexOf(Math.min(...distances));

        if (debug) {
            const closestPos = planetPositions[closestPlanetIndex];
            const worldPos = getWorldPosition(system.obj, closestPos);

            // convert the planet radius to world
            const planetRadius = (RADIUS_BUFFER + closestPos.r) * Hex.SCALE;
            drawSphereAroundPlanet(worldPos, planetRadius);
        }

        return planets[closestPlanetIndex];
    }
}

function getExactPlanet(pos, debug) {
    const system = getSystem(pos);
    if (system && system.system.planets.length > 0) {
        const localPos = getLocalPosition(system.obj, pos);
        const planetPositions = getPlanetHelper(system.system);
        const planets = system.system.planets;

        const onPlanet = planetPositions
            .map(
                (element, index) =>
                    withinCircle(element, localPos) && !planets[index].destroyed
            )
            .indexOf(true);

        if (onPlanet > -1) {
            if (debug) {
                const planetPos = planetPositions[onPlanet];
                const worldPos = getWorldPosition(system.obj, planetPos);

                // convert the planet radius to world position
                const planetRadius = (RADIUS_BUFFER + planetPos.r) * Hex.SCALE;
                drawSphereAroundPlanet(worldPos, planetRadius);
            }
            return planets[onPlanet];
        }
    }
}

module.exports = { getClosestPlanet, getExactPlanet, getSystem };
