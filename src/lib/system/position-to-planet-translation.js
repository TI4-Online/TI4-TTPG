const { System } = require("./system");
const { ObjectNamespace } = require("../object-namespace");
const { Vector, world, Color } = require("@tabletop-playground/api");
const SYSTEM_ATTRS = require("./system.data");
const { Hex } = require("../hex");

const SCALE = Hex.SCALE;

// TODO: mirage
// TODO: better Clan of Saar home system

// constants used to draw debug spheres
const DEBUG_COLOR = new Color(0, 0, 0);
const DEBUG_DURATION = 10;
const DEBUG_THICKNESS = 0.1;
const TILE_HEIGHT = 0.253 * SCALE;

// increase this to make determing if a position is on a planet more lenient
// decrease it to make the check more strict
const RADIUS_BUFFER = 0.0;

// Arrays to group systems whose planets are all in the same locations.
const STANDARD_ONE_PLANET_HOME_SYSTEMS = [
    1, 2, 3, 4, 5, 6, 7, 8, 52, 53, 54, 56,
];
const STANDARD_TWO_PLANET_HOME_SYSTEMS = [9, 10, 12, 13, 14, 15, 57];
const STANDARD_ONE_PLANET_SYSTEMS = [
    19, 20, 21, 22, 23, 24, 59, 60, 61, 62, 63,
];
const ONE_PLANET_WITH_WORMHOLE_SYSTEMS = [25, 26, 64];
const STANDARD_TWO_PLANET_SYSTEMS = [
    27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 69, 70, 71, 72, 73, 74,
];
const STANDARD_THREE_PLANET_SYSTEMS = [75, 76];

/**
 * Convert cartesian coordinates to polar coordinates.
 *
 * If x is 0, theta is automatically set to 0.
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {{r: Number, theta: Number}}
 */
function getPolarCoords(x, y) {
    return {
        r: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
        theta: x === 0 ? 0 : Math.atan(y / x),
    };
}

/**
 * Convert polar coordinates to cartesian coordinates.
 *
 * There is probably a better way to handle this, but I needed to multiply the
 * x and y outputs if the planet was above the center of the system tile.
 * @param {Number} r
 * @param {Number} theta
 * @param {boolean} above
 * @returns {{x: Number, y: Number}}
 */
function getCartesianCoords(r, theta, above) {
    const mult = above ? -1 : 1;
    return {
        x: mult * r * Math.cos(theta),
        y: mult * r * Math.sin(theta),
    };
}

/**
 * Given a System return the position (in polar coordinates) of each of its
 * planets relative to the center of the tile and the radius of each planet.
 *
 * Accounts for the scale of the system tiles.
 *
 * @param {System} system
 * @returns {[{polarCoords: {r: Number, theta: Numner}, r: Number}]}
 */
function getPlanetLocationsHelper(system) {
    const tile = system.tile;

    if (tile === 11) {
        // Clan of Saar Home System
        return [
            {
                polarCoords: getPolarCoords(SCALE * 2, SCALE * -1.25),
                r: SCALE * 1.75,
            },
            {
                polarCoords: getPolarCoords(SCALE * -1.8, SCALE * 1.75),
                r: SCALE * 1.75,
            },
        ];
    } else if (tile === 16) {
        // Hacan Home System
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.5, SCALE * -2.75),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * 2.3, SCALE * 1.3),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * -2.4, SCALE * 1.9),
                r: SCALE * 2,
            },
        ];
    } else if (tile === 18) {
        // Mecatol Rex
        return [{ polarCoords: getPolarCoords(0, 0), r: SCALE * 4 }];
    } else if (tile === 51) {
        // Creuss Home System
        return [{ polarCoords: getPolarCoords(SCALE, 0), r: SCALE * 2 }];
    } else if (tile === 55) {
        // Elysium Titans Home System
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.75, 0),
                r: SCALE * 3.25,
            },
        ];
    } else if (tile === 58) {
        // Argent Home System
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.5, SCALE * -2.75),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * 2.3, SCALE * 1.3),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * -2.5, SCALE * 1.7),
                r: SCALE * 2,
            },
        ];
    } else if (tile === 65 || tile === 66) {
        // Hope's End or Primor
        return [{ polarCoords: getPolarCoords(0, 0), r: SCALE * 3.25 }];
    } else if (tile === 67) {
        // Cormund
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.7, -SCALE),
                r: SCALE * 2,
            },
        ];
    } else if (tile === 68) {
        // Everra
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.5, -SCALE),
                r: SCALE * 2,
            },
        ];
    } else if (tile == 82) {
        // Malice
        return [
            {
                polarCoords: getPolarCoords(SCALE * 1.2, SCALE),
                r: SCALE * 2,
            },
        ];
    } else if (STANDARD_ONE_PLANET_HOME_SYSTEMS.indexOf(tile) > -1) {
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.65, 0),
                r: SCALE * 2,
            },
        ];
    } else if (STANDARD_ONE_PLANET_SYSTEMS.indexOf(tile) > -1) {
        return [{ polarCoords: getPolarCoords(0, 0), r: SCALE * 2 }];
    } else if (ONE_PLANET_WITH_WORMHOLE_SYSTEMS.indexOf(tile) > -1) {
        return [
            {
                polarCoords: getPolarCoords(SCALE * 2, SCALE * -1.25),
                r: SCALE * 2,
            },
        ];
    } else if (STANDARD_TWO_PLANET_HOME_SYSTEMS.indexOf(tile) > -1) {
        return [
            {
                polarCoords: getPolarCoords(SCALE * 2, SCALE * -1.25),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * -1.8, SCALE * 1.9),
                r: SCALE * 2,
            },
        ];
    } else if (STANDARD_TWO_PLANET_SYSTEMS.indexOf(tile) > -1) {
        return [
            {
                polarCoords: getPolarCoords(SCALE * 2, SCALE * -1.25),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * -2, SCALE),
                r: SCALE * 2,
            },
        ];
    } else if (STANDARD_THREE_PLANET_SYSTEMS.indexOf(tile) > -1) {
        return [
            {
                polarCoords: getPolarCoords(SCALE * 0.5, SCALE * -3),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * 2, SCALE * 1.5),
                r: SCALE * 2,
            },
            {
                polarCoords: getPolarCoords(SCALE * -2.7, SCALE * 1.65),
                r: SCALE * 2,
            },
        ];
    } else {
        return [];
    }
}

/**
 * Given a System, its x, y position, rotation and an array of destroyed planets
 * in the system return an array of the x, y positions and radii of all planets
 * thatin the System.
 *
 * @param {System} system
 * @param {Number} X
 * @param {Number} Y
 * @param {Number} rotation
 * @param {[Number]} destroyedPlanetIndices
 * @returns {[{x: Number, y: Number, r: Number}]}
 */
function getPlanetLocations(system, X, Y, rotation, destroyedPlanetIndices) {
    const unrotatedPlanetLocations = getPlanetLocationsHelper(system);
    const rotationRadians = Math.round(rotation) * (Math.PI / 180);
    const planetLocations = unrotatedPlanetLocations.map(
        (element, index, arr) => {
            const theta = element.polarCoords.theta;
            const r = element.polarCoords.r;
            const rotatedPos = getCartesianCoords(
                r,
                theta + rotationRadians,
                index === arr.length - 1 && arr.length > 1 // is the planet above the center of the tile
            );
            return { x: rotatedPos.x + X, y: rotatedPos.y + Y, r: element.r };
        }
    );
    return planetLocations.filter(
        (_element, index) => destroyedPlanetIndices.indexOf(index) === -1
    );
}

/**
 * Given a system tile number, return an array of the planet names in the
 * original schema. This is necessary to check if planets have been destroyed
 *
 * @param {Number} tile
 * @returns {[string]}
 */
function getOriginalSystemPlanets(tile) {
    for (const rawAttrs of SYSTEM_ATTRS) {
        if (rawAttrs.tile === tile) {
            return rawAttrs.planets.map((element) => {
                return element.localeName;
            });
        }
    }
}

/**
 * Returns the System, if any, that pos is over top of along with the x, y
 * coordinates and rotation of the system object and the names of all planets
 * in the system schema.
 *
 * @param {Vector} pos
 * @returns {{system: System,
 *            originalPlanets: [string],
 *            x: Number,
 *            y: number,
 *            rotation: number}}
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
                originalPlanets: getOriginalSystemPlanets(parsedSystem.tile),
                x: pos.x,
                y: pos.y,
                rotation: hit.object.getRotation().yaw,
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
 * With a tolerance of RADIUS_BUFFER * Hex.SCALE
 *
 * Not using TTPG built in Vector distance because we don't care about the
 * Z dimension.
 *
 * @param {{x: Number, y: Number, r: Number}} circle
 * @param {{x: Number, y: Number}} point
 * @returns {Number}
 */
function withinCircle(circle, point) {
    return distance(circle, point) <= circle.r + RADIUS_BUFFER * SCALE;
}

/**
 * Given the current System object and the initial array of planet names in the
 * system which if any planets were destroyed. Returns the index in the original
 * System planets array of the destroyed system, or an empty array if there
 * were no destroyed planets.
 *
 * @param {System} currSystem
 * @param {[string]} originalPlanets
 * @returns {[Number]}
 */
function getDestroyedPlanets(currSystem, originalPlanets) {
    const currPlanetNames = currSystem.planets.map(
        (element) => element.raw.localeName
    );

    let destroyedPlanets = [];
    originalPlanets.forEach((element, index) => {
        if (currPlanetNames.indexOf(element) === -1) {
            destroyedPlanets.push(index);
        }
    });
    return destroyedPlanets;
}

/**
 * Get the Planet that is closest to pos, if pos is a point on a system tile.
 *
 * If debug is true and there is more than one planet in the system, a debug
 * sphere) will be drawn around the closest planet.
 *
 * @param {Vector} pos
 * @param {boolean} debug
 * @returns {Planet}
 */
function getClosestPlanet(pos, debug) {
    const system = getSystem(pos);
    if (system) {
        const currSystemPlanets = system.system.planets;

        if (currSystemPlanets.length === 1) {
            // only one planet therefore must be the closest planet
            return currSystemPlanets[0];
        } else if (currSystemPlanets.length > 1) {
            const destroyedPlanets = getDestroyedPlanets(
                system.system,
                system.originalPlanets
            );

            let planetLocations = getPlanetLocations(
                system.system,
                system.x,
                system.y,
                system.rotation,
                destroyedPlanets
            );

            const distances = planetLocations.map((element) =>
                distance(element, pos)
            );
            const shortestDistanceIndex = distances.indexOf(
                Math.min(...distances)
            );

            if (debug) {
                // draw a sphere around the closest planet
                const planetLocation = planetLocations[shortestDistanceIndex];
                const pos = new Vector(
                    planetLocation.x,
                    planetLocation.y,
                    world.getTableHeight() + TILE_HEIGHT
                );
                world.drawDebugSphere(
                    pos,
                    planetLocation.r + RADIUS_BUFFER * SCALE,
                    DEBUG_COLOR,
                    DEBUG_DURATION,
                    DEBUG_THICKNESS
                );
            }
            return currSystemPlanets[shortestDistanceIndex];
        }
    }
}

/**
 * Get the Planet, if any, that pos is exactly overtop of.
 *
 * If debug is true, a sphere (visible only to the host) will be drawn around
 * the planet that pos is overtop of.
 *
 * @param {Vector} pos
 * @param {boolean} debug
 * @returns {Planet}
 */
function getExactPlanet(pos, debug) {
    const system = getSystem(pos);
    if (system) {
        const currSystemPlanets = system.system.planets;
        if (currSystemPlanets.length >= 1) {
            const destroyedPlanets = getDestroyedPlanets(
                system.system,
                system.originalPlanets
            );

            const planetLocations = getPlanetLocations(
                system.system,
                system.x,
                system.y,
                system.rotation,
                destroyedPlanets
            );

            const onPlanet = planetLocations
                .map((element) => withinCircle(element, pos))
                .indexOf(true);

            if (onPlanet > -1) {
                if (debug) {
                    // draw a sphere around the planet
                    const planetLocation = planetLocations[onPlanet];
                    const pos = new Vector(
                        planetLocation.x,
                        planetLocation.y,
                        world.getTableHeight() + TILE_HEIGHT
                    );
                    world.drawDebugSphere(
                        pos,
                        planetLocation.r + RADIUS_BUFFER * SCALE,
                        DEBUG_COLOR,
                        DEBUG_DURATION,
                        DEBUG_THICKNESS
                    );
                }
                return currSystemPlanets[onPlanet];
            }
        }
    }
}

module.exports = { getClosestPlanet, getExactPlanet, getSystem };
