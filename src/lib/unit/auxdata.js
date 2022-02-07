const assert = require("../../wrapper/assert");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { Hex } = require("../hex");
const { UnitAttrs } = require("./unit-attrs");
const { UnitAttrsSet } = require("./unit-attrs-set");
const { UnitModifier } = require("./unit-modifier");
const { UnitPlastic } = require("./unit-plastic");

/**
 * Repository for per-player unit state.
 *
 * THIS IS THE INTERFACE TO UNIT DATA!
 *
 * Use `createForPair()` to get modified units involved in a combat.
 */
class AuxData {
    /**
     * Given a combat between two players, create and fill in the AuxData
     * records for each.
     *
     * Accounts for:
     * - player unit upgrades ("Carrier II")
     * - self-modifiers ("Morale Boost")
     * - from-opponent-modifiers ("Disable")
     * - faction abilities ("Fragile")
     *
     * It will find all units in the primary hex as well as adjacent hexes,
     * assigning cardboard tokens to the closest in-hex plastic.
     *
     * This is a VERY expensive method, may want to make it asynchronous.
     *
     * @param {number} playerSlot1
     * @param {number} playerSlot2 - pass -1 to compute based on hex and/or planet
     * @param {string} hex - optional, restrict to units in this and adjacent hexes
     * @param {string} planet - optional, restrict to units on or above planet
     * @returns {[AuxData, AuxData]} list with two AuxData entries
     */
    static createForPair(playerSlot1, playerSlot2, hex, planet) {
        assert(typeof playerSlot1 === "number");
        assert(typeof playerSlot2 === "number");
        assert(!hex || typeof hex === "string");
        assert(!planet || typeof planet === "string");

        // If given a hex but not a planet, look for units in adjacent hexes.
        const adjHexes = new Set();
        if (hex && !planet) {
            for (const adjHex of Hex.neighbors(hex)) {
                adjHexes.add(adjHex);
            }
            // TODO XXX WORMHOLE ADJACENCY
            // TODO XXX HYPERLANE ADJACENCY
        }

        // Get plastic, group into per-unit hex and adjacent sets.
        const allPlastic = hex ? UnitPlastic.getAll() : [];
        let hexPlastic = allPlastic.filter((plastic) => plastic.hex === hex);
        const adjPlastic = allPlastic.filter((plastic) =>
            adjHexes.has(plastic.hex)
        );
        UnitPlastic.assignTokens(hexPlastic);
        UnitPlastic.assignTokens(adjPlastic);

        // If no explicit opponent, figure it from "not-us" plastic in hex.
        if (playerSlot2 < 0) {
            for (const plastic of hexPlastic) {
                if (plastic.owningPlayerSlot === playerSlot1) {
                    continue; // ignore our own units
                }
                if (plastic.owningPlayerSlot === playerSlot2) {
                    continue; // ignore if we already think this is opponent
                }
                if (playerSlot2 < 0) {
                    playerSlot2 = plastic.owningPlayerSlot;
                } else {
                    // Multiple opponents!
                    Broadcast.broadcastAll(
                        locale("ui.error.too_many_opponents")
                    );
                    playerSlot2 = -1;
                    break;
                }
            }
        }

        // Only assign units in hex to planets.
        if (planet) {
            UnitPlastic.assignPlanets(hexPlastic);
            hexPlastic = hexPlastic.filter(
                (plastic) => plastic.planet === planet
            );
        }

        // Create and fill in for a single player.
        const createSolo = (selfSlot, opponentSlot) => {
            assert(typeof selfSlot === "number");
            assert(typeof opponentSlot === "number");

            const aux = new AuxData(selfSlot);
            if (selfSlot < 0) {
                return aux;
            }

            // Get hex and adjacent plastic for this player.
            // Also get counts, beware of x3 tokens!
            const playerHexPlastic = hexPlastic.filter(
                (plastic) => plastic.owningPlayerSlot == selfSlot
            );
            aux.plastic.push(...playerHexPlastic);
            for (const plastic of playerHexPlastic) {
                const count = aux.count(plastic.unit);
                aux.overrideCount(plastic.unit, count + plastic.count);
            }
            const playerAdjPlastic = adjPlastic.filter(
                (plastic) => plastic.owningPlayerSlot == selfSlot
            );
            aux.adjacentPlastic.push(...playerAdjPlastic);
            for (const plastic of playerAdjPlastic) {
                const count = aux.adjacentCount(plastic.unit);
                aux.overrideAdjacentCount(plastic.unit, count + plastic.count);
            }

            // Apply unit upgrades.
            const upgrades = UnitAttrs.getPlayerUnitUpgrades(selfSlot);
            for (const upgrade of upgrades) {
                aux.unitAttrsSet.upgrade(upgrade);
            }

            // Register present per-unit modifiers in overall modifiers list.
            for (const unitAttrs of aux.unitAttrsSet.values()) {
                if (!aux.has(unitAttrs.raw.unit)) {
                    continue; // not present
                }
                if (!unitAttrs.raw.unitAbility) {
                    continue; // no ability
                }
                const unitModifier = UnitModifier.getUnitAbilityUnitModifier(
                    unitAttrs.raw.unitAbility
                );
                if (unitModifier) {
                    aux.unitModifiers.push(unitModifier);
                }
            }

            // Get modifiers.  For each perspective get "self modifiers" and
            // "opponent modifiers applied to opponent".
            const modifiersSelf = UnitModifier.getPlayerUnitModifiers(
                selfSlot,
                "self"
            );
            const modifiersOpponent = UnitModifier.getPlayerUnitModifiers(
                opponentSlot,
                "opponent"
            );
            aux.unitModifiers.push(...modifiersSelf);
            aux.unitModifiers.push(...modifiersOpponent);

            // Add any faction modifiers.
            // TODO XXX LOOK UP FACTION BY PLAYER SLOT, ADD MODIFIERS TO AUX.FACTIONABILITIES!
            for (const factionAbility of []) {
                const unitModifier =
                    UnitModifier.getFactionAbilityUnitModifier(factionAbility);
                if (unitModifier) {
                    aux.unitModifiers.push(unitModifier);
                }
            }

            UnitModifier.sortPriorityOrder(aux.unitModifiers);

            return aux;
        };
        const aux1 = createSolo(playerSlot1, playerSlot2);
        const aux2 = createSolo(playerSlot2, playerSlot1);

        // As the final step, apply modifiers (receive AuxData).
        // Modifiers that dig deep into opponent unit attributes may race with
        // other modifiers (e.g. one makes units ships, another counts ships).
        // Conceivably could make multiple passes, but most only care about own type.
        const applyModifiers = (selfAux, opponentAux) => {
            assert(selfAux instanceof AuxData);
            assert(opponentAux instanceof AuxData);
            for (const unitModifier of selfAux.unitModifiers) {
                unitModifier.apply(selfAux.unitAttrsSet, {
                    self: selfAux,
                    opponent: opponentAux,
                });
            }
        };
        applyModifiers(aux1, aux2);
        applyModifiers(aux2, aux1);

        return [aux1, aux2];
    }

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
