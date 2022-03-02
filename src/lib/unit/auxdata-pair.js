const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { AdjacencyHyperlane } = require("../system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../system/adjacency-wormhole");
const { AuxData } = require("./auxdata");
const { Broadcast } = require("../broadcast");
const { Hex } = require("../hex");
const { UnitAttrs } = require("./unit-attrs");
const { UnitAttrsSet } = require("./unit-attrs-set");
const { UnitModifier } = require("./unit-modifier");
const { UnitPlastic } = require("./unit-plastic");
const { world } = require("../../wrapper/api");

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
 * If the opponent (playerSlot2) is not given, detect it based on plastic.
 *
 * This is a VERY expensive process, may want to make it asynchronous.
 */
class AuxDataPair {
    /**
     * Fill in AuxData objects for a combat between two players.
     *
     * Adjancy calculations use auxData1.hex.
     * Planet assigment uses auxData1.planet.
     *
     * @param {AuxData} auxData1
     * @param {AuxData} auxData2 - may be -1 to identify opponent based on plastic
     */
    constructor(auxData1, auxData2) {
        assert(auxData1 instanceof AuxData);
        assert(auxData2 instanceof AuxData);

        this._aux1 = auxData1;
        this._aux2 = auxData2;

        this._aux1.setOpponent(this._aux2);
        this._aux2.setOpponent(this._aux1);

        this._hex = this._aux1.hex;
        this._planet = this._aux1.planet;
        this._adjHexes = new Set();
        this._allPlastic = false;
        this._hexPlastic = false;
        this._adjPlastic = false;

        this._enableModifierFiltering = true;
    }

    disableModifierFiltering() {
        this._enableModifierFiltering = false;
        return this;
    }

    _getProcessQueue() {
        return [
            () => {
                this.computeAdjHexes();
            },
            () => {
                this.computePlatic();
            },
            () => {
                this.computeOpponent();
            },
            () => {
                this.computeSelfUnitCounts(this._aux1);
            },
            () => {
                this.computeSelfUnitCounts(this._aux2);
            },
            () => {
                this.computeSelfUnitUpgrades(this._aux1);
            },
            () => {
                this.computeSelfUnitUpgrades(this._aux2);
            },
            () => {
                this.computeSelfUnitAbilities(this._aux1, this._aux2);
            },
            () => {
                this.computeSelfUnitAbilities(this._aux2, this._aux1);
            },
            () => {
                this.computeSelfUnitModifiers(this._aux1, this._aux2);
            },
            () => {
                this.computeSelfUnitModifiers(this._aux2, this._aux1);
            },
            () => {
                this.computeSelfFactionAbilities(this._aux1, this._aux2);
            },
            () => {
                this.computeSelfFactionAbilities(this._aux2, this._aux1);
            },
            () => {
                this.applySelfUnitModifiers(this._aux1, this._aux2);
            },
            () => {
                this.applySelfUnitModifiers(this._aux2, this._aux1);
            },
        ];
    }

    /**
     * Fill in the two AuxData objects.
     */
    fillPairSync() {
        const processQueue = this._getProcessQueue();
        for (const processEntry of processQueue) {
            processEntry();
        }
    }

    /**
     * Fill in the two AuxData objects.
     *
     * @param {function} callback - (AuxData, AuxData) args
     */
    fillPairAsync(callback) {
        const processQueue = this._getProcessQueue();
        const processNext = () => {
            const processEntry = processQueue.shift();
            if (!processEntry) {
                callback(this._aux1, this._aux2);
                return;
            }
            processEntry();
            process.nextTick(processNext);
        };
        processNext();
    }

    /**
     * If given a hex but not a planet, compute the set of adjacent hexes.
     */
    computeAdjHexes() {
        if (this._hex && !this._planet) {
            const adjNeighbor = new AdjacencyNeighbor(this._hex);
            for (const adjHex of adjNeighbor.getAdjacent()) {
                this._adjHexes.add(adjHex);
            }

            const playerSlot = this._aux1.playerSlot; // aux1 perspective
            const adjWormhole = new AdjacencyWormhole(this._hex, playerSlot);
            for (const adjHex of adjWormhole.getAdjacent()) {
                this._adjHexes.add(adjHex);
            }

            const adjHyperlane = new AdjacencyHyperlane(this._hex);
            for (const adjHex of adjHyperlane.getAdjacent()) {
                this._adjHexes.add(adjHex);
            }

            // This hex is not considered adjacent here, even if wormhole, etc.
            this._adjHexes.delete(this._hex);
        }

        // Remove any hexes that do not contain a system tile.
        const newAdjHexes = new Set();
        this._adjHexes.forEach((hex) => {
            const pos = Hex.toPosition(hex);
            if (world.TI4.getSystemTileObjectByPosition(pos)) {
                newAdjHexes.add(hex);
            }
        });
        this._adjHexes = newAdjHexes;
    }

    /**
     * Get all plasic in hex and adjacent hexes.  Restrict to "on planet"
     * plastic if a planet combat.
     */
    computePlatic() {
        this._allPlastic = this._hex ? UnitPlastic.getAll() : [];
        this._hexPlastic = this._allPlastic.filter(
            (plastic) => plastic.hex === this._hex
        );
        this._adjPlastic = this._allPlastic.filter((plastic) =>
            this._adjHexes.has(plastic.hex)
        );
        UnitPlastic.assignTokens(this._hexPlastic);
        UnitPlastic.assignTokens(this._adjPlastic);

        if (this._planet) {
            // If using a planet, get units on and ships above planet.
            UnitPlastic.assignPlanets(this._hexPlastic);
            this._hexPlastic = this._hexPlastic.filter(
                (plastic) =>
                    plastic.planet &&
                    plastic.planet.localeName === this._planet.localeName
            );
        }
    }

    /**
     * If no opponent was given compute one based on "not us" plastic in fight.
     */
    computeOpponent() {
        if (this._aux2.playerSlot >= 0) {
            return; // already have an oppoent
        }

        // Consider a system with two planets controlled by A and B, and
        // player C controls the space area.  Player D then activates the
        // system with the intention of firing PDS2 at player C.
        //
        // Units have already been pruned down to only those on/above planet
        // for per-planet fights.

        // Prune down to other players' plastic.
        let otherPlastic = this._hexPlastic.filter(
            (plastic) => plastic.owningPlayerSlot !== this._aux1.playerSlot
        );

        // If combat does not have a planet only consider ships.  Note there
        // may be some odd cases like a mech in space that has not yet gotten
        // that attribute set.  Ignore those for now, would need multiple
        // passes and/or special "early" modifiers for those.
        if (!this._planet) {
            const defaultUnitAttrsSet = new UnitAttrsSet();
            otherPlastic = otherPlastic.filter((plastic) => {
                const unitAttrs = defaultUnitAttrsSet.get(plastic.unit);
                return unitAttrs.raw.ship;
            });
        }

        // Expect at most one other player's plastic, they are the opponent.
        for (const plastic of otherPlastic) {
            if (plastic.owningPlayerSlot === this._aux2.playerSlot) {
                continue; // ignore if we already think this is opponent
            }
            if (this._aux2.playerSlot < 0) {
                // First opponent found, use it.
                this._aux2.overridePlayerSlot(plastic.owningPlayerSlot);
            } else {
                // Different opponent found, not a legal board state!
                Broadcast.broadcastAll(locale("ui.error.too_many_opponents"));
                this._aux2.overridePlayerSlot(-1);
                break;
            }
        }
    }

    /**
     * Count units belonging to this player in the main and ajacent hexes.
     *
     * @param {AuxData} selfAuxData
     */
    computeSelfUnitCounts(selfAuxData) {
        assert(selfAuxData instanceof AuxData);

        // Get hex and adjacent plastic for this player.
        // Also get counts, beware of x3 tokens!
        const playerHexPlastic = this._hexPlastic.filter(
            (plastic) => plastic.owningPlayerSlot == selfAuxData.playerSlot
        );
        selfAuxData.plastic.push(...playerHexPlastic);
        for (const plastic of playerHexPlastic) {
            const count = selfAuxData.count(plastic.unit);
            selfAuxData.overrideCount(plastic.unit, count + plastic.count);
        }
        const playerAdjPlastic = this._adjPlastic.filter(
            (plastic) => plastic.owningPlayerSlot == selfAuxData.playerSlot
        );
        selfAuxData.adjacentPlastic.push(...playerAdjPlastic);
        for (const plastic of playerAdjPlastic) {
            const count = selfAuxData.adjacentCount(plastic.unit);
            selfAuxData.overrideAdjacentCount(
                plastic.unit,
                count + plastic.count
            );
        }
    }

    /**
     * Gather and apply applicable unit upgrades.
     *
     * @param {AuxData} selfAuxData
     */
    computeSelfUnitUpgrades(selfAuxData) {
        assert(selfAuxData instanceof AuxData);

        // Abort if anonymous AuxData.
        if (selfAuxData.playerSlot < 0) {
            return;
        }

        // Find unit upgrades.
        const upgrades = UnitAttrs.getPlayerUnitUpgrades(
            selfAuxData.playerSlot
        );
        if (selfAuxData.faction) {
            const factionUpgrades = UnitAttrs.getFactionUnitUpgrades(
                selfAuxData.faction
            );
            upgrades.push(...factionUpgrades);
        }

        // Make sure there are no duplicates (paranoia).
        upgrades.filter((value, index, self) => self.indexOf(value) === index);

        // Apply upgrades now, so unit modifiers can see upgraded units.
        UnitAttrs.sortUpgradeLevelOrder(upgrades);
        for (const upgrade of upgrades) {
            selfAuxData.unitAttrsSet.upgrade(upgrade);
        }
    }

    /**
     * Gather BUT DO NOT APPLY unit-ability unit modifiers.
     * A unit-ability unit modifier are things like flagship abilities.
     *
     * @param {AuxData} selfAuxData
     */
    computeSelfUnitAbilities(selfAuxData) {
        // Abort if anonymous AuxData.
        if (selfAuxData.playerSlot < 0) {
            return;
        }

        for (const unitAttrs of selfAuxData.unitAttrsSet.values()) {
            if (!selfAuxData.has(unitAttrs.raw.unit)) {
                continue; // not present
            }
            if (!unitAttrs.raw.unitAbility) {
                continue; // no ability
            }
            const unitModifier = UnitModifier.getUnitAbilityUnitModifier(
                unitAttrs.raw.unitAbility
            );
            if (unitModifier) {
                selfAuxData.unitModifiers.push(unitModifier);
            }
        }
    }

    /**
     * Gather BUT DO NOT APPLY card-given unit modifiers.
     *
     * @param {AuxData} selfAuxData
     * @param {AuxData} opponentAuxData
     */
    computeSelfUnitModifiers(selfAuxData, opponentAuxData) {
        assert(selfAuxData instanceof AuxData);
        assert(opponentAuxData instanceof AuxData);

        // Abort if anonymous AuxData.
        if (selfAuxData.playerSlot < 0) {
            return;
        }

        // Get modifiers.  For each perspective get "self modifiers" and
        // "opponent modifiers applied to opponent".
        const modifiersSelf = UnitModifier.getPlayerUnitModifiers(
            selfAuxData.playerSlot,
            "self"
        );
        const modifiersOpponent = UnitModifier.getPlayerUnitModifiers(
            opponentAuxData.playerSlot,
            "opponent"
        );
        selfAuxData.unitModifiers.push(...modifiersSelf);
        selfAuxData.unitModifiers.push(...modifiersOpponent);

        // Get other modifiers that decide if they apply based on more
        // information, such as nebula defense checks for nebula and defender.
        const modifiersIf = UnitModifier.getTriggerIfUnitModifiers(selfAuxData);
        selfAuxData.unitModifiers.push(...modifiersIf);
    }

    /**
     * Gather BUT DO NOT APPLY faction-ability unit modifiers.
     *
     * @param {AuxData} selfAuxData
     * @param {AuxData} opponentAuxData
     */
    computeSelfFactionAbilities(selfAuxData, opponentAuxData) {
        assert(selfAuxData instanceof AuxData);
        assert(opponentAuxData instanceof AuxData);

        // Get faction-intrinsic modifiers (faction abilities).
        if (selfAuxData.faction) {
            const factionModifiers = UnitModifier.getFactionUnitModifiers(
                selfAuxData.faction,
                "self"
            );
            selfAuxData.unitModifiers.push(...factionModifiers);
        }
        if (opponentAuxData.faction) {
            const factionModifiers = UnitModifier.getFactionUnitModifiers(
                opponentAuxData.faction,
                "opponent"
            );
            selfAuxData.unitModifiers.push(...factionModifiers);
        }
    }

    /**
     * Delay this until after computing unit counts for self AND opponent!
     *
     * @param {AuxData} selfAuxData
     * @param {AuxData} opponentAuxData
     */
    applySelfUnitModifiers(selfAuxData, opponentAuxData) {
        assert(selfAuxData instanceof AuxData);
        assert(opponentAuxData instanceof AuxData);

        // Filter out duplicates.
        let modifiers = selfAuxData.unitModifiers;
        modifiers = modifiers.filter(
            (value, index, self) => self.indexOf(value) === index
        );

        // Let modifiers remove themselves.
        if (this._enableModifierFiltering) {
            modifiers = modifiers.filter((modifier) => {
                if (!modifier.raw.filter) {
                    return true; // no filter
                }
                return modifier.raw.filter(selfAuxData);
            });
        }

        selfAuxData.unitModifiers.length = 0; // clears
        selfAuxData.unitModifiers.push(...modifiers);

        // Apply in mutate -> adjust -> choose order.
        UnitModifier.sortPriorityOrder(selfAuxData.unitModifiers);
        for (const unitModifier of selfAuxData.unitModifiers) {
            unitModifier.apply(selfAuxData.unitAttrsSet, selfAuxData);
        }
    }
}

module.exports = { AuxDataPair };
