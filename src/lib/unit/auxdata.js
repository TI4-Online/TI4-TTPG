const assert = require("../../wrapper/assert-wrapper");
const { UnitAttrsSet } = require("./unit-attrs-set");

/**
 * Repository for per-player unit state.
 *
 * THIS IS THE INTERFACE TO UNIT DATA!
 *
 * Use `createForPair()` to get modified units involved in a combat.
 */
class AuxData {
    /**
     * Constructor.  Creates an empty but usable AuxData.
     */
    constructor(playerSlot) {
        assert(typeof playerSlot === "number");

        this._playerSlot = playerSlot;

        this._unitAttrsSet = new UnitAttrsSet();
        this._unitModifiers = []; // Array.{UnitModifier}

        this._unitToCount = {}; // Object.{string:number}
        this._unitToAdjacentCount = {}; // Object.{string:number}

        this._plastic = []; // Array.{UnitPlastic}
        this._adjacentPlastic = []; // Array.{UnitPlastic}

        this._faction = undefined; // string NSID name ("letnev")
        this._factionAbilities = []; // Array.{string} faction abilties
    }

    /**
     * Is there at least one unit of the given type in the main hex?
     *
     * @param {string} unit
     * @returns {boolean}
     */
    has(unit) {
        assert(typeof unit === "string");
        return this.count(unit) > 0;
    }

    /**
     * Is there at least one unit of the given type in any adjacent hex?
     *
     * @param {string} unit
     * @returns {boolean}
     */
    hasAdjacent(unit) {
        assert(typeof unit === "string");
        return this.adjacentCount(unit) > 0;
    }

    /**
     * How many units of the given type in the main hex?
     *
     * @param {string} unit
     * @returns {number}
     */
    count(unit) {
        assert(typeof unit === "string");
        return this._unitToCount[unit] || 0;
    }

    /**
     * How many units of the given type in all adjacent hexes?
     *
     * @param {string} unit
     * @returns {number}
     */
    adjacentCount(unit) {
        assert(typeof unit === "string");
        return this._unitToAdjacentCount[unit] || 0;
    }

    /**
     * Replace the unit count for main hex units.
     *
     * @param {string} unit
     * @param {number} value
     */
    overrideCount(unit, value) {
        assert(typeof unit === "string");
        assert(typeof value === "number");
        this._unitToCount[unit] = value;
    }

    /**
     * Replace the unit count for adjacent units.
     *
     * @param {string} unit
     * @param {number} value
     */
    overrideAdjacentCount(unit, value) {
        assert(typeof unit === "string");
        assert(typeof value === "number");
        this._unitToAdjacentCount[unit] = value;
    }

    /**
     * Player slot.
     *
     * @returns {number} -1 if unknown
     */
    get playerSlot() {
        return this._playerSlot;
    }

    /**
     * Unit attributes.
     *
     * @returns {UnitAttrsSet}
     */
    get unitAttrsSet() {
        return this._unitAttrsSet;
    }

    /**
     * Unit modifiers.
     *
     * @returns {Array.{UnitModifier}}
     */
    get unitModifiers() {
        return this._unitModifiers;
    }

    /**
     * Units in main hex.
     *
     * @returns {Array.{UnitPlastic}}
     */
    get plastic() {
        return this._plastic;
    }

    /**
     * Units in adjacent hexes.
     *
     * @returns {Array.{UnitPlastic}}
     */
    get adjacentPlastic() {
        return this._adjacentPlastic;
    }

    /**
     * Faction NSID name.
     *
     * @returns {string}
     */
    get faction() {
        return this._faction;
    }

    /**
     * Faction abilities.
     *
     * @returns {Array.{string}}
     */
    get factionAbilities() {
        return this._factionAbilities;
    }
}

module.exports = { AuxData };
