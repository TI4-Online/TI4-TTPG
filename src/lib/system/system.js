const assert = require("../../wrapper/assert");
const { SystemSchema } = require("./system.schema");
const SYSTEM_ATTRS = require("./system-attrs.data");
const { Card } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");

let _tileToSystem = false;
let _planetLocaleNameToPlanet = false;

function _maybeInit(tile) {
    if (!_tileToSystem) {
        _tileToSystem = {};
        for (const rawAttrs of SYSTEM_ATTRS) {
            const system = new System(rawAttrs);
            assert(!_tileToSystem[system.tile]);
            _tileToSystem[system.tile] = system;
        }

        _planetLocaleNameToPlanet = {};
        for (const system of Object.values(_tileToSystem)) {
            for (const planet of system.planets) {
                _planetLocaleNameToPlanet[planet.raw.localeName] = planet;
            }
        }
    }
}

/**
 * A single planet in a system.  May change over time due to attachments, etc.
 */
class Planet {
    /**
     * Retrieve the planet object.  Do not use the contructor directly,
     * because attachements, etc, modify the shared instance.
     *
     * @param {Card} planetCard
     * @returns {Planet}
     */
    static getByPlanetCard(planetCard) {
        assert(planetCard instanceof Card);
        _maybeInit();

        const parsedNsid = ObjectNamespace.parseCard(planetCard);
        assert(parsedNsid.deck === "planet");
        const localeName = "planet." + parsedNsid.name;
        return _planetLocaleNameToPlanet[localeName];
    }

    constructor(attrs) {
        this._attrs = attrs;
    }

    get raw() {
        return this._attrs;
    }
}

/**
 * System tile.  May change over time due to attachments, etc.
 */
class System {
    /**
     * Retrieve the system object.  Do not use the contructor directly,
     * because attachements, etc, modify the shared instance.
     *
     * @param {number} tile
     * @returns {System}
     */
    static getByTile(tile) {
        assert(typeof tile === "number");
        _maybeInit();
        return _tileToSystem[tile];
    }

    constructor(systemAttrs) {
        assert(SystemSchema.validate(systemAttrs));
        this._attrs = systemAttrs;
        if (systemAttrs.planets) {
            this._planets = systemAttrs.planets.map(
                (planeAttrs) => new Planet(planeAttrs)
            );
        } else {
            this._planets = []; // keep an empty array, mirage/etc might be added later
        }
    }

    get tile() {
        return this._attrs.tile;
    }

    get planets() {
        return this._planets;
    }

    get raw() {
        return this._attrs;
    }
}

module.exports = { System, Planet };
