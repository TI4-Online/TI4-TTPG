const assert = require("../../wrapper/assert-wrapper");
const { Faction } = require("../faction/faction");
const { System, Planet } = require("../system/system");
const { UnitAttrsSet } = require("./unit-attrs-set");

/**
 * Builder interface to fill in base AuxData elements.
 *
 * Some things like unit attributes and modifiers are filled in by
 * AuxDataPair (doing a table scan to find them).
 */
class AuxDataBuilder {
    constructor() {
        this._playerSlot = -1;
        this._faction = false;
        this._hex = false;
        this._activatingPlayerSlot = -1;
        this._activeSystem = false;
        this._activePlanet = false;
    }

    /**
     * Set player slot.
     *
     * @param {number} faction
     * @returns {AuxDataBuilder} self for chaining
     */
    setPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        this._playerSlot = playerSlot;
        return this;
    }

    /**
     * Set faction.
     *
     * @param {Faction} faction
     * @returns {AuxDataBuilder} self for chaining
     */
    setFaction(faction) {
        assert(!faction || faction instanceof Faction);
        this._faction = faction;
        return this;
    }

    /**
     * Set hex.
     *
     * @param {string} hex
     * @returns {AuxDataBuilder} self for chaining
     */
    setHex(hex) {
        assert(typeof hex === "string");
        this._hex = hex;
        return this;
    }

    /**
     * Set activating player slot.
     *
     * @param {number} activatingPlayerSlot
     * @returns {AuxDataBuilder} self for chaining
     */
    setActivatingPlayerSlot(activatingPlayerSlot) {
        assert(typeof activatingPlayerSlot === "number");
        this._activatingPlayerSlot = activatingPlayerSlot;
        return this;
    }

    /**
     *
     * @param {System} system
     * @returns {AuxDataBuilder} self for chaining
     */
    setActiveSystem(system) {
        assert(!system || system instanceof System);
        this._activeSystem = system;
        return this;
    }

    /**
     *
     * @param {Planet} planet
     * @returns {AuxDataBuilder} self for chaining
     */
    setActivePlanet(planet) {
        assert(!planet || planet instanceof Planet);
        this._activePlanet = planet;
        return this;
    }

    /**
     * Build AuxData.
     *
     * @returns {AuxData}
     */
    build() {
        return new AuxData(this);
    }
}

/**
 * Repository for per-player unit state.
 *
 * THIS IS THE INTERFACE TO UNIT DATA!
 */
class AuxData {
    /**
     * Constructor.  Use AuxDataBuilder.build to create these.
     */
    constructor(auxDataBuilder) {
        assert(auxDataBuilder instanceof AuxDataBuilder);

        this._opponentAuxData = false;

        this._playerSlot = auxDataBuilder._playerSlot;
        this._faction = auxDataBuilder._faction;
        this._hex = auxDataBuilder._hex;
        this._activatingPlayerSlot = auxDataBuilder._activatingPlayerSlot;
        this._activeSystem = auxDataBuilder._activeSystem;
        this._activePlanet = auxDataBuilder._activePlanet;

        this._unitAttrsSet = new UnitAttrsSet();
        this._unitModifiers = []; // Array.{UnitModifier}

        this._unitToCount = {}; // Object.{string:number}
        this._unitToAdjacentCount = {}; // Object.{string:number}

        this._plastic = []; // Array.{UnitPlastic}
        this._adjacentPlastic = []; // Array.{UnitPlastic}
    }

    /**
     * Should be constructior-time set, but opponent might not exist yet.
     *
     * @param {AuxData} auxData
     * @returns {AuxData} self, for chaining
     */
    setOpponent(auxData) {
        assert(auxData instanceof AuxData);
        this._opponentAuxData = auxData;
        return this;
    }

    /**
     * For readability, modifers use 'auxData.self' and 'auxData.opponent'.
     *
     * @return {AuxData}
     */
    get self() {
        return this;
    }

    /**
     * For readability, modifers use 'auxData.self' and 'auxData.opponent'.
     *
     * @return {AuxData}
     */
    get opponent() {
        return this._opponentAuxData;
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
     * Faction.
     *
     * @returns {Faction}
     */
    get faction() {
        return this._faction;
    }

    /**
     * Active hex.
     *
     * @returns {string}
     */
    get hex() {
        return this._hex;
    }

    /**
     * Which player(slot) activated the current system?
     *
     * @returns {number}
     */
    get activatingPlayerSlot() {
        return this._activatingPlayerSlot;
    }

    /**
     * Currently active system.
     *
     * @returns {System} may be false
     */
    get activeSystem() {
        return this._activeSystem;
    }
    /**
     * Currently active system.
     *
     * @returns {System} may be false
     */
    get activePlanet() {
        return this._activePlanet;
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
     * Replace the owning player slot.
     *
     * @param {number} playerSlot
     * @returns {AuxData} self for chaining
     */
    overridePlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        this._playerSlot = playerSlot;
        return this;
    }

    /**
     * Replace the unit count for main hex units.
     *
     * @param {string} unit
     * @param {number} value
     * @returns {AuxData} self for chaining
     */
    overrideCount(unit, value) {
        assert(typeof unit === "string");
        assert(typeof value === "number");
        this._unitToCount[unit] = value;
        return this;
    }

    /**
     * Replace the unit count for adjacent units.
     *
     * @param {string} unit
     * @param {number} value
     * @returns {AuxData} self for chaining
     */
    overrideAdjacentCount(unit, value) {
        assert(typeof unit === "string");
        assert(typeof value === "number");
        this._unitToAdjacentCount[unit] = value;
        return this;
    }
}

module.exports = { AuxDataBuilder, AuxData };
