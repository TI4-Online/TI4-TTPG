const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Facing } = require("../facing");
const { ObjectNamespace } = require("../object-namespace");
const { Card, GameObject, globalEvents, world } = require("../../wrapper/api");
const SYSTEM_ATTRS = require("./system.data");

// Lookup tables.
let _tileToSystem = false;
let _planetLocaleNameToPlanet = false;

// Reset every globalEvents.TI4.onSystemActivated
let _activeSystemGameObject = false;

globalEvents.TI4.onSystemActivated.add((systemTile, player) => {
    _activeSystemGameObject = systemTile;
});

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
     * @returns {Planet|undefined}
     */
    static getByCard(planetCard) {
        assert(planetCard instanceof Card);
        const nsid = ObjectNamespace.getNsid(planetCard);
        return Planet.getByCardNsid(nsid);
    }

    /**
     * Retrieve the planet object by the card NSID.
     *
     * @param {string} planetCardNsid
     * @returns {Planet|undefined}
     */
    static getByCardNsid(planetCardNsid) {
        assert(typeof planetCardNsid === "string");
        _maybeInit();

        if (!planetCardNsid.startsWith("card.planet")) {
            return undefined;
        }

        const parsed = ObjectNamespace.parseNsid(planetCardNsid);
        const localeName = "planet." + parsed.name;
        return _planetLocaleNameToPlanet[localeName];
    }

    constructor(attrs, system) {
        this._attrs = attrs;
        this._system = system;
    }

    get raw() {
        return this._attrs;
    }

    get localeName() {
        return this.raw.localeName;
    }

    get destroyed() {
        return this.raw.destroyed;
    }

    set destroyed(value) {
        this.raw.destroyed = value;
    }

    get radius() {
        return this.raw.radius;
    }

    get position() {
        return this.raw.position;
    }

    get system() {
        return this._system;
    }

    getNameStr() {
        return locale(this.localeName);
    }

    getPlanetNsidName() {
        const localeName = this.localeName;
        const m = this.localeName.match(/^planet\.([^.]*)$/);
        if (!m) {
            throw new Error(
                `planet "${localeName}" does not follow name convention`
            );
        }
        return m[1];
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
     * @param {number} tileNumber
     * @returns {System}
     */
    static getByTileNumber(tileNumber) {
        assert(typeof tileNumber === "number");
        _maybeInit();
        return _tileToSystem[tileNumber];
    }

    /**
     * Get the system from the associated system tile game object.
     *
     * @param {GameObject} obj
     * @returns {System|undefined}
     */
    static getBySystemTileObject(obj) {
        assert(obj instanceof GameObject);
        if (!ObjectNamespace.isSystemTile(obj)) {
            return undefined;
        }

        const parsed = ObjectNamespace.parseSystemTile(obj);
        const system = this.getByTileNumber(parsed.tile);

        // Reset inherent wormholes based on object!
        if (system.raw.wormholesFaceDown) {
            if (Facing.isFaceDown(obj)) {
                system._wormholes = [...system.raw.wormholesFaceDown];
            } else {
                system._wormholes = [...system.raw.wormholes];
            }
        }

        return system;
    }

    /**
     * Get the first system tile game object at position.
     *
     * @param {Vector} pos
     * @returns {GameObject}
     */
    static getSystemTileObjectByPosition(pos) {
        assert(typeof pos.x === "number");

        const src = pos.add([0, 0, 50]);
        const dst = pos.subtract([0, 0, 50]);
        const hits = world.lineTrace(src, dst);
        for (const hit of hits) {
            if (ObjectNamespace.isSystemTile(hit.object)) {
                return hit.object;
            }
        }
    }

    /**
     * Get all system tiles on the table.
     *
     * @returns {Array.{GameObject}}
     */
    static getAllSystemTileObjects() {
        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const parsed = ObjectNamespace.parseSystemTile(obj);
            if (parsed.tile === 0) {
                continue;
            }
            result.push(obj);
        }
        return result;
    }

    /**
     * Get the currently active system tile.  Note that a competing
     * globalEvents.TI4.onSystemActivated handler might be called first,
     * and should used the given active system tile argument.
     *
     * @returns {GameObject|undefined}
     */
    static getActiveSystemTileObject() {
        return _activeSystemGameObject;
    }

    constructor(systemAttrs) {
        this._attrs = systemAttrs;

        this._planets = [];
        if (systemAttrs.planets) {
            this._planets.push(
                ...systemAttrs.planets.map(
                    (planeAttrs) => new Planet(planeAttrs, this)
                )
            );
        }

        this._wormholes = [];
        if (systemAttrs.wormholes) {
            this._wormholes.push(...systemAttrs.wormholes);
        }

        this._anomalies = [];
        if (systemAttrs.anomalies) {
            this._anomalies.push(...systemAttrs.anomalies);
        }

        this._traits = [];
        if (systemAttrs.traits) {
            this._traits.push(...systemAttrs.traits);
        }
    }

    get tile() {
        return this._attrs.tile;
    }

    get home() {
        return this._attrs.home;
    }

    get planets() {
        // Planets may be added (Mirage) and removed (Stellar Converter).
        return this._planets;
    }

    get wormholes() {
        // TODO XXX check if system if face up / down
        // Depending on how we manage wormhole tokens might be adding/removing!
        return this._wormholes;
    }

    get anomalies() {
        return this._anomalies;
    }

    get traits() {
        return this._traits;
    }

    get raw() {
        return this._attrs;
    }

    getSummaryStr() {
        const summary = [];
        summary.push(
            ...this.planets.map((planet) => {
                return locale(planet.raw.localeName);
            })
        );
        summary.push(
            ...this.wormholes.map((wormhole) => {
                return locale("wormhole." + wormhole);
            })
        );
        return summary.join(", ");
    }
}

module.exports = { System, Planet };
