const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Facing } = require("../facing");
const { ObjectNamespace } = require("../object-namespace");
const { SystemSchema } = require("./system.schema");
const {
    Card,
    GameObject,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");
const SYSTEM_ATTRS = require("./system.data");
const { Broadcast } = require("../broadcast");

const SYSTEM_TIER = {
    LOW: "low",
    MED: "med",
    HIGH: "high",

    MECATOL: "mecatol",
    HOME: "home",
    RED: "red",
    HYPERLANE: "hyperlane",
    OFF_MAP: "offMap",
    OTHER: "other",
};

// Lookup tables.
let _tileToSystem = false;
let _planetLocaleNameToPlanet = false;

// Reset every globalEvents.TI4.onSystemActivated
let _activeSystemGameObject = false;

globalEvents.TI4.onSystemActivated.add((systemTile, player) => {
    _activeSystemGameObject = systemTile;
});

const ONE_PLANET_HOME_POSITION = { x: 0.65, y: 0 };
const ONE_PLANET_HOME_RADIUS = 2;
const TWO_PLANET_HOME_POSITION = [
    { x: 2, y: -1.25 },
    { x: -1.8, y: 1.9 },
];
const TWO_PLANET_HOME_RADIUS = [2, 2];
const ONE_PLANET_POSITION = { x: 0, y: 0 };
const ONE_PLANET_RADIUS = 2;
const TWO_PLANET_POSITION = [
    { x: 2, y: -1.25 },
    { x: -2, y: 1 },
];
const TWO_PLANET_RADIUS = [2, 2];
const THREE_PLANET_POSITION = [
    { x: 0.5, y: -3 },
    { x: 2, y: 1.5 },
    { x: -2.7, y: 1.65 },
];
const THREE_PLANET_RADIUS = [2, 2, 2];

function _maybeInit() {
    if (!_tileToSystem) {
        _tileToSystem = {};
        for (const rawAttrs of SYSTEM_ATTRS) {
            const system = new System(rawAttrs);
            if (_tileToSystem[system.tile]) {
                Broadcast.chatAll(`Overwriting system tile ${system.tile}`);
            }
            _tileToSystem[system.tile] = system;
        }
    }
    if (!_planetLocaleNameToPlanet) {
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

    constructor(attrs, system, planetIndex, standardPosition, standardRadius) {
        assert(typeof planetIndex === "number");
        assert(typeof standardRadius === "number");

        this._attrs = attrs;
        this._system = system;
        this._planetIndex = planetIndex;
        this._attachments = [];

        // if the given system attributes does not contain radius
        // or position information set position and radius with standard
        if (!this._attrs.position) {
            this._attrs.position = standardPosition;
        }

        if (!this._attrs.radius) {
            this._attrs.radius = standardRadius;
        }
    }

    get raw() {
        return this._attrs;
    }

    get attachments() {
        return this._attachments;
    }

    get destroyed() {
        return this.raw.destroyed;
    }

    set destroyed(value) {
        this.raw.destroyed = value;
    }

    get firstTech() {
        return this.raw.tech ? this.raw.tech[0] : undefined;
    }

    get firstTrait() {
        return this.raw.trait ? this.raw.trait[0] : undefined;
    }

    get localeName() {
        return this.raw.localeName;
    }

    get planetIndex() {
        return this._planetIndex;
    }

    get position() {
        return this.raw.position;
    }

    get radius() {
        return this.raw.radius;
    }

    get system() {
        return this._system;
    }

    get traits() {
        return this.raw.trait ? this.raw.trait : [];
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

    getPlanetCardNsid() {
        let source = this.system.raw.source;
        const nsidName = this.getPlanetNsidName();
        if (nsidName === "mirage") {
            source = "pok";
        }
        return `card.planet:${source}/${nsidName}`;
    }
}

/**
 * System tile.  May change over time due to attachments, etc.
 */
class System {
    static getAllSystems() {
        _maybeInit();
        return Object.values(_tileToSystem);
    }

    /**
     * Get system tile numbers ranked by tier (for drafting).
     * Excludes home systems, hyperlanes, etc not suitable for use.
     *
     * @returns {Object}
     */
    static getAllTileNumbersTiered() {
        const seen = new Set();
        const low = [];
        const med = [];
        const high = [];
        const red = [];
        for (const system of world.TI4.getAllSystems()) {
            if (seen.has(system.tile)) {
                console.log(
                    `System.getAllTileNumbersTiered: duplicated tile ${system.tile}`
                );
                continue;
            }
            seen.add(system.tile);

            const tier = system.calculateTier();
            if (tier === SYSTEM_TIER.LOW) {
                low.push(system.tile);
            } else if (tier === SYSTEM_TIER.MED) {
                med.push(system.tile);
            } else if (tier === SYSTEM_TIER.HIGH) {
                high.push(system.tile);
            } else if (tier === SYSTEM_TIER.RED) {
                red.push(system.tile);
            }
        }
        return { low, med, high, red };
    }

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
        const system = System.getByTileNumber(parsed.tile);

        // Reset inherent wormholes based on object!
        // This does not play well with attach tokens.
        // That's ok, wormhole adjacency looks for tokens.
        if (system && system.raw.wormholesFaceDown) {
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

    static summarize(tiles, includeOptimal) {
        assert(Array.isArray(tiles));
        let res = 0;
        let optRes = 0;
        let inf = 0;
        let optInf = 0;
        let tech = [];
        let wormholes = [];
        let legendaries = [];

        for (const tile of tiles) {
            const system = System.getByTileNumber(tile);
            assert(system);
            for (const planet of system.planets) {
                const r = planet.raw.resources;
                const i = planet.raw.influence;
                res += r;
                inf += i;
                if (r > i) {
                    optRes += r;
                } else if (r < i) {
                    optInf += i;
                } else {
                    optRes += r / 2;
                    optInf += i / 2;
                }
                if (planet.raw.tech) {
                    for (const planetTech of planet.raw.tech) {
                        tech.push(planetTech.substring(0, 1).toUpperCase());
                    }
                }
                if (planet.raw.legendary) {
                    legendaries.push("L");
                }
            }
            for (const wormhole of system.wormholes) {
                switch (wormhole) {
                    case "alpha":
                        wormholes.push("α");
                        break;
                    case "beta":
                        wormholes.push("β");
                        break;
                    case "gamma":
                        wormholes.push("γ");
                        break;
                    case "delta":
                        wormholes.push("δ");
                        break;
                }
            }
        }
        const result = [`${res}/${inf}`];
        if (includeOptimal) {
            result.push(`(${optRes}/${optInf})`);
        }
        if (tech.length > 0) {
            result.push(tech.sort().join(""));
        }
        if (wormholes.length > 0) {
            result.push(wormholes.sort().join(""));
        }
        if (legendaries.length > 0) {
            result.push(legendaries.sort().join(""));
        }
        return result.join(" ");
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

    /**
     * Never invalidate systems table or planet objects as attachments, etc
     * live there.
     *
     * We can invalidate the planet name cache however, after adding new
     * planets.
     */
    static invalidatePlanetNameCache() {
        _planetLocaleNameToPlanet = undefined;
    }

    static injectSystem(rawSystem) {
        assert(rawSystem);
        _maybeInit();

        SystemSchema.validate(rawSystem, (err) => {
            throw new Error(
                `System.injectSystem schema error ${JSON.stringify(err)}`
            );
        });

        // Add this new system.
        const system = new System(rawSystem);
        if (_tileToSystem[system.tile]) {
            Broadcast.chatAll(
                `System.injectSystem overwriting system tile ${system.tile}`,
                Broadcast.ERROR
            );
        }
        _tileToSystem[system.tile] = system;
        System.invalidatePlanetNameCache();
    }

    constructor(systemAttrs) {
        this._attrs = systemAttrs;

        this._planets = [];
        if (systemAttrs.planets) {
            this._planets.push(
                ...systemAttrs.planets.map((planetAttrs, index, arr) => {
                    if (systemAttrs.home && arr.length === 1) {
                        return new Planet(
                            planetAttrs,
                            this,
                            index,
                            ONE_PLANET_HOME_POSITION,
                            ONE_PLANET_HOME_RADIUS
                        );
                    } else if (systemAttrs.home && arr.length === 2) {
                        return new Planet(
                            planetAttrs,
                            this,
                            index,
                            TWO_PLANET_HOME_POSITION[index],
                            TWO_PLANET_HOME_RADIUS[index]
                        );
                    } else if (!systemAttrs.home && arr.length === 1) {
                        return new Planet(
                            planetAttrs,
                            this,
                            index,
                            ONE_PLANET_POSITION,
                            ONE_PLANET_RADIUS
                        );
                    } else if (!systemAttrs.home && arr.length === 2) {
                        return new Planet(
                            planetAttrs,
                            this,
                            index,
                            TWO_PLANET_POSITION[index],
                            TWO_PLANET_RADIUS[index]
                        );
                    } else if (arr.length === 3) {
                        return new Planet(
                            planetAttrs,
                            this,
                            index,
                            THREE_PLANET_POSITION[index],
                            THREE_PLANET_RADIUS[index]
                        );
                    } else {
                        return new Planet(planetAttrs, this, index);
                    }
                })
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

        // Compute this early, before Mirage or other things might mutate the system.
        this._isRed =
            (this._planets.length === 0 || this._anomalies.length > 0) &&
            this._attrs.tile > 0 &&
            this._attrs.tile !== 18 &&
            !this._attrs.home &&
            !this._attrs.hyperlane;
        this._isBlue =
            this._planets.length > 0 &&
            this._anomalies.length === 0 &&
            this._attrs.tile > 0 &&
            this._attrs.tile !== 18 &&
            !this._attrs.home &&
            !this._attrs.hyperlane;
    }

    get tile() {
        return this._attrs.tile;
    }

    get home() {
        return this._attrs.home;
    }

    get hyperlane() {
        return this._attrs.hyperlane;
    }

    get planets() {
        // Planets may be added (Mirage) and removed (Stellar Converter).
        return this._planets;
    }

    get wormholes() {
        // getBySystemTileObject adjusts for face up/down
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

    get red() {
        return this._isRed;
    }

    get blue() {
        return this._isBlue;
    }

    get tileNsid() {
        return `tile.system:${this.raw.source}/${this.tile}`;
    }

    get img() {
        return this._attrs.img;
    }

    get packageId() {
        return this._attrs.packageId ? this._attrs.packageId : refPackageId;
    }

    get legendary() {
        for (const planet of this.planets) {
            if (planet.raw.legendary) {
                return true;
            }
        }
        return false;
    }

    getSummaryStr() {
        const summary = [];
        summary.push(
            ...this.planets
                .filter((planet) => {
                    return !planet.destroyed;
                })
                .map((planet) => {
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

    /**
     * Compute system tier (low, med, or high) using "DangerousGoods" method:
     *
     * - MED is systems with 2 or more planets and no tech skips.
     *
     * - HIGH are the systems with 2 or more planets with tech skips and
     * the legendaries, and Atlas / Lodor.
     *
     * - LOW is the single planet systems + Quann.
     */
    calculateTier() {
        // Handle some special cases before looking at blue systems.
        if (this.tile === 18) {
            return SYSTEM_TIER.MECATOL;
        } else if (this.tile === 81) {
            return SYSTEM_TIER.OTHER; // muaat hero supernova tile
        } else if (this.home) {
            return SYSTEM_TIER.HOME;
        } else if (this.red) {
            return SYSTEM_TIER.RED;
        } else if (this.hyperlane) {
            return SYSTEM_TIER.HYPERLANE;
        } else if (this.tile <= 0) {
            return SYSTEM_TIER.OTHER;
        } else if (this.raw.offMap) {
            return SYSTEM_TIER.OFF_MAP;
        }

        const planetCount = this.planets.length;
        const techCount = this.planets.filter(
            (planet) => planet.firstTech
        ).length;
        const hasLegendary =
            this.planets.filter((planet) => planet.raw.legendary).length > 0;

        // Special case move Atlas/Lodor to med.
        if (this.tile === 26 || this.tile === 64) {
            return SYSTEM_TIER.HIGH;
        }

        if ((planetCount >= 2 && techCount >= 1) || hasLegendary) {
            return SYSTEM_TIER.HIGH;
        }

        if (planetCount >= 2 && techCount === 0) {
            return SYSTEM_TIER.MED;
        }

        if (planetCount === 1) {
            return SYSTEM_TIER.LOW;
        }

        throw new Error(`system ${this.tile}: ${this.getSummaryStr()}`);
    }

    calculateOptimal() {
        let res = 0;
        let inf = 0;
        let optRes = 0;
        let optInf = 0;
        for (const planet of this.planets) {
            const r = planet.raw.resources;
            const i = planet.raw.influence;
            res += r;
            inf += i;
            if (r > i) {
                optRes += r;
            } else if (r < i) {
                optInf += i;
            } else {
                optRes += r / 2;
                optInf += i / 2;
            }
        }
        return { res, inf, optRes, optInf };
    }
}

module.exports = { System, Planet, SYSTEM_TIER };
