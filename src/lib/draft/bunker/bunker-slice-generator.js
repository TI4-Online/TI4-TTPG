const assert = require("../../../wrapper/assert-wrapper");
const { Shuffle } = require("../../shuffle");
const { world } = require("../../../wrapper/api");

// Rank systems, lifted from the original VolverMilty draft.
// Legendary: 65, 66
const TILE_TIERS = {
    high: [27, 28, 35, 37, 30, 69, 72, 75],
    med: [26, 29, 38, 33, 34, 62, 64, 65, 66, 70, 71, 74, 76],
    low: [19, 20, 21, 22, 23, 24, 25, 31, 32, 36, 59, 60, 61, 63, 73],
};

const TILE_TYPE = {
    RED: "red",
    HIGH: "high",
    MED: "med",
    LOW: "low",
};

const INNER_RED_COUNT_DISTRIBUTION = [
    { weight: 1, value: 1 },
    { weight: 6, value: 2 },
    { weight: 3, value: 3 },
];

const INNER_BLUE_TILE_TYPE_DISTRIBUTION = [
    { weight: 3, value: TILE_TYPE.HIGH },
    { weight: 4, value: TILE_TYPE.MED },
    { weight: 3, value: TILE_TYPE.LOW },
];

const ONE_REDS_BUNKER_TYPES_DISTRIBUTION = [
    { weight: 4, value: [TILE_TYPE.HIGH, TILE_TYPE.LOW, TILE_TYPE.LOW] }, // sum 5
    { weight: 4, value: [TILE_TYPE.MED, TILE_TYPE.MED, TILE_TYPE.LOW] }, // sum 5
    { weight: 2, value: [TILE_TYPE.MED, TILE_TYPE.LOW, TILE_TYPE.LOW] }, // sum 4
];

const TWO_REDS_BUNKER_TYPES_DISTRIBUTION = [
    { weight: 4, value: [TILE_TYPE.HIGH, TILE_TYPE.MED] }, // sum 5
    { weight: 3, value: [TILE_TYPE.MED, TILE_TYPE.MED] }, // sum 4
    { weight: 3, value: [TILE_TYPE.HIGH, TILE_TYPE.LOW] }, // sum 4
];

const MIN_WORMHOLE_COUNT_DISTRIBUTION = [
    { weight: 1, value: 2 },
    { weight: 1, value: 3 },
];
const MIN_LEGENDARY_COUNT_DISTRIBUTION = [
    { weight: 1, value: 1 },
    { weight: 1, value: 2 },
];

/**
 * Information about one bunker.
 */
class Bunker {
    constructor() {
        this._entries = [
            { tileType: undefined, tile: undefined },
            { tileType: undefined, tile: undefined },
            { tileType: undefined, tile: undefined },
            { tileType: undefined, tile: undefined },
        ];
    }

    getEntries() {
        return this._entries;
    }

    getEntry(index) {
        assert(typeof index === "number");
        assert(0 <= index && index < 4);
        return this._entries[index];
    }

    getNumReds() {
        let result = 0;
        for (const entry of this._entries) {
            if (entry.tileType === TILE_TYPE.RED) {
                result += 1;
            }
        }
        return result;
    }
}

/**
 * A "Bunker" is a four system "slice" wrapped around a home system.
 * There is an innder circle of other systems.
 */
class BunkerSliceGenerator {
    static get minCount() {
        return world.TI4.config.playerCount;
    }

    static get maxCount() {
        return 9; // milty draft max is 9
    }

    /**
     * Get all red tile numbers.
     *
     * @returns {Array.{number}}
     */
    static _getRedTileNumbers() {
        return world.TI4.getAllSystems()
            .filter((system) => {
                // 81 is Muatt hero supernova
                return system.red && system.tile !== 81;
            })
            .map((system) => system.tile);
    }

    /**
     * Choose an option from a weighted set.
     *
     * @param {Array.{Object.{weight:number,value:?}}} options
     * @returns {?} the value component from the chosen option
     */
    static _weightedChoice(options) {
        assert(Array.isArray(options));
        options.forEach((option) => {
            assert(typeof option.weight === "number");
            assert(option.weight >= 0);
            assert(option.value);
        });
        let total = 0;
        for (const option of options) {
            total += option.weight;
        }
        let target = Math.random() * total;
        for (const option of options) {
            if (target <= option.weight) {
                return option.value;
            }
            target -= option.weight;
        }
        throw new Error("unreachable");
    }

    /**
     * How many red tiles should be in the inner ring?
     * (And thus how many need to be placed in bunkers?)
     *
     * @param {number} bunkerCount
     * @returns {number}
     */
    static _getNumInnerReds(playerCount) {
        assert(typeof playerCount === "number");
        let numInnerReds = BunkerSliceGenerator._weightedChoice(
            INNER_RED_COUNT_DISTRIBUTION
        );
        if (numInnerReds > playerCount) {
            numInnerReds = playerCount;
        }
        return numInnerReds;
    }

    /**
     * Choose the four TILE_TYPEs (tier or red) in each bunker.
     *
     * @param {number} count
     * @return {Array.{Array.{string}}}
     */
    static _getBunkerTileTypes(bunkerCount, numInnerReds) {
        assert(typeof bunkerCount === "number");
        assert(typeof numInnerReds === "number");

        // Array of arrays, inner arrays are TILE_TYPE values.
        const bunkerTypesArray = new Array(bunkerCount).fill(0).map(() => []);

        // Spread reds around, might not be even.
        const remainingReds = bunkerCount * 2 - numInnerReds;
        for (let i = 0; i < remainingReds; i++) {
            const bunkerIndex = i % bunkerCount;
            const bunkerTypes = bunkerTypesArray[bunkerIndex];
            bunkerTypes.push(TILE_TYPE.RED);
        }

        // Now choose from available bunker styles given num reds.
        for (const bunkerTypes of bunkerTypesArray) {
            const numReds = bunkerTypes.length; // all are red here
            let choices;
            if (numReds === 1) {
                choices = ONE_REDS_BUNKER_TYPES_DISTRIBUTION;
            } else if (numReds === 2) {
                choices = TWO_REDS_BUNKER_TYPES_DISTRIBUTION;
            } else {
                throw new Error("invalid red count");
            }
            const choice = BunkerSliceGenerator._weightedChoice(choices);
            for (const tileType of choice) {
                bunkerTypes.push(tileType);
            }
            Shuffle.shuffle(bunkerTypes);
            assert(bunkerTypes.length === 4);
        }

        return bunkerTypesArray;
    }

    /**
     * Compute TILE_TYPE values for inner ring.  Does not account for
     * if a tier empties, consumer can adjust if needed.
     *
     * @param {number} playerCount
     * @param {number} numInnerReds
     * @returns {Array.{string}}
     */
    static _getInnerRingTileTypes(playerCount, numInnerReds) {
        assert(typeof playerCount === "number");
        assert(typeof numInnerReds === "number");

        const tileTypes = [];

        while (tileTypes.length < numInnerReds) {
            tileTypes.push(TILE_TYPE.RED);
        }

        while (tileTypes.length < playerCount) {
            const tileType = BunkerSliceGenerator._weightedChoice(
                INNER_BLUE_TILE_TYPE_DISTRIBUTION
            );
            assert(typeof tileType === "string");
            tileTypes.push(tileType);
        }

        return tileTypes;
    }

    /**
     * Swap an active tile for an unused one with the feature.
     *
     * @param {string} wormholeType - alpha, beta, or legendary
     * @param {Array.{number}} active
     * @param {Array.{number}} unused
     * @returns {boolean} true on success
     */
    static _promoteWormhole(wormholeType, active, unused) {
        assert(typeof wormholeType === "string");
        assert(Array.isArray(active));
        assert(Array.isArray(unused));
        active.forEach((tile) => assert(typeof tile === "number"));
        unused.forEach((tile) => assert(typeof tile === "number"));

        // Find a wormhold to add.
        let foldInWormhole = undefined;
        for (const tile of unused) {
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
            if (
                system.wormholes.includes(wormholeType) ||
                (wormholeType === "legendary" && system.raw.legendary)
            ) {
                foldInWormhole = tile;
                break;
            }
        }
        if (!foldInWormhole) {
            return false;
        }

        // Find a non-wormhole to remove.
        let foldOutNonWormhole = undefined;
        for (const tile of active) {
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
            if (system.wormholes.length === 0 && !system.raw.legendary) {
                foldOutNonWormhole = tile;
                break;
            }
        }
        if (!foldOutNonWormhole) {
            return false;
        }

        // Move the wormhold from unused to active.
        let index = unused.indexOf(foldInWormhole);
        assert(index >= 0);
        unused.splice(index, 1);
        active.push(foldInWormhole);

        // Move the "to replace" tile from active to unused.
        index = active.indexOf(foldOutNonWormhole);
        assert(index >= 0);
        active.splice(index, 1);
        unused.push(foldOutNonWormhole);

        return true;
    }

    /**
     * Swap a wormhole from unused to active.
     *
     * @param {string} wormholeType
     * @param {Object.{high,med.low}} actives
     * @param {Object.{high,med.low}} unuseds
     * @returns {boolean}
     */
    static _promoteWormholeRandomizeTier(wormholeType, actives, unuseds) {
        assert(typeof wormholeType === "string");
        assert(Array.isArray(actives.high));
        assert(Array.isArray(actives.med));
        assert(Array.isArray(actives.low));
        assert(Array.isArray(actives.red));
        assert(Array.isArray(unuseds.high));
        assert(Array.isArray(unuseds.med));
        assert(Array.isArray(unuseds.low));
        assert(Array.isArray(unuseds.red));

        const tiers = Shuffle.shuffle(Object.values(TILE_TYPE));
        for (const tier of tiers) {
            let active, unused;
            if (tier === TILE_TYPE.HIGH) {
                active = actives.high;
                unused = unuseds.high;
            } else if (tier === TILE_TYPE.MED) {
                active = actives.med;
                unused = unuseds.med;
            } else if (tier === TILE_TYPE.LOW) {
                active = actives.low;
                unused = unuseds.low;
            } else if (tier === TILE_TYPE.RED) {
                active = actives.red;
                unused = unuseds.red;
            } else {
                throw new Error("invalid type");
            }
            if (
                BunkerSliceGenerator._promoteWormhole(
                    wormholeType,
                    active,
                    unused
                )
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Choose one available tile.  May consider tiles aready used by peer entries.
     *
     * @param {Array.{Object.{tileType,tile}}} entries
     * @param {Array.{number}} availableTiles
     * @returns
     */
    static _chooseAndRemoveFromAvailableTiles(entries, availableTiles) {
        assert(Array.isArray(entries));
        assert(Array.isArray(availableTiles));

        let entriesRes = 0;
        let entriesInf = 0;
        let entriesWormhole = false;
        let entriesLegendary = false;
        const entriesTraitSet = new Set();
        const entriesTechSet = new Set();
        for (const entry of entries) {
            if (entry.tile) {
                const system = world.TI4.getSystemByTileNumber(entry.tile);
                for (const planet of system.planets) {
                    entriesRes += planet.raw.resources;
                    entriesInf += planet.raw.influence;

                    const trait = planet.firstTrait;
                    if (trait) {
                        entriesTraitSet.add(trait);
                    }

                    const tech = planet.firstTech;
                    if (tech) {
                        entriesTechSet.add(tech);
                    }
                }
                if (system.wormholes.length > 0) {
                    entriesWormhole = true;
                }
                if (system.raw.legendary) {
                    entriesLegendary = true;
                }
            }
        }
        const entryIsRes = entriesRes > entriesInf; // fill the other one

        const choices = [];
        for (const tile of availableTiles) {
            let res = 0,
                inf = 0,
                techOverlap = false,
                traitOverlap = false,
                wormhole = false,
                legendary = false;
            const system = world.TI4.getSystemByTileNumber(tile);
            for (const planet of system.planets) {
                res += planet.raw.resources;
                inf += planet.raw.influence;

                const trait = planet.firstTrait;
                if (trait && entriesTraitSet.has(trait)) {
                    traitOverlap = true;
                }

                const tech = planet.firstTech;
                if (tech && entriesTechSet.has(tech)) {
                    techOverlap = true;
                }
            }
            if (system.wormholes.length > 0) {
                wormhole = true;
            }
            if (system.raw.legendary) {
                legendary = true;
            }

            let weight = 1;
            const isRes = res > inf;
            if (isRes != entryIsRes) {
                weight += 1;
            }
            if (!techOverlap) {
                weight += 1;
            }
            if (!traitOverlap) {
                weight += 1;
            }

            // Avoid doubles.
            if (entriesWormhole && wormhole) {
                weight = 0.01;
            }
            if (entriesLegendary && legendary) {
                weight = 0.01;
            }

            choices.push({ weight, value: tile });
        }

        const tile = BunkerSliceGenerator._weightedChoice(choices);
        const index = availableTiles.indexOf(tile);
        assert(index >= 0);
        availableTiles.splice(index, 1);

        return tile;
    }

    static _separateAnomalies(entries) {
        assert(Array.isArray(entries));

        for (let a = 0; a < entries.length; a++) {
            const b = (a + 1) % entries.length;
            const entryA = entries[a];
            const entryB = entries[b];
            const systemA = world.TI4.getSystemByTileNumber(entryA.tile);
            const systemB = world.TI4.getSystemByTileNumber(entryB.tile);
            const anomalyA = systemA.anomalies.length > 0;
            const anomalyB = systemB.anomalies.length > 0;

            // If two adjacent anomalies, swap second with next non-anomaly.
            // This does not verify the swap destination, but as long as it
            // does not wrap that will be addressed in a later iteration.
            if (anomalyA && anomalyB) {
                for (let offset = 2; offset < entries.length; offset++) {
                    const c = (a + offset) % entries.length;
                    const entryC = entries[c];
                    const systemC = world.TI4.getSystemByTileNumber(
                        entryC.tile
                    );
                    const anomalyC = systemC.anomalies.length > 0;
                    if (!anomalyC) {
                        entries[b] = entryC;
                        entries[c] = entryB;
                        break;
                    }
                }
            }
        }
    }

    constructor() {
        this.reset();
    }

    reset() {
        this._playerCount = world.TI4.config.playerCount;
        this._bunkerCount = world.TI4.config.playerCount + 1;
        this._numInnerReds = undefined; // number
        this._bunkers = undefined; // {Array.{Bunker}}
        this._innerRingEntries = undefined; // {Array.{tileType:string,tile:number}}

        // Tiles not (yet) used in any bunker or inner ring.
        this._unused = {
            high: Shuffle.shuffle([...TILE_TIERS.high]),
            med: Shuffle.shuffle([...TILE_TIERS.med]),
            low: Shuffle.shuffle([...TILE_TIERS.low]),
            red: Shuffle.shuffle(BunkerSliceGenerator._getRedTileNumbers()),
        };

        // Tiles available for use, sized to number needed.
        this._tiles = {
            high: [],
            med: [],
            low: [],
            red: [],
        };
    }

    getBunkerCount() {
        return this._bunkerCount;
    }

    /**
     * Simple endpoint to run the full generator.
     *
     * @param {number} bunkerCount
     * @returns {Object.{bunkers,innerRing}}
     */
    simpleGenerate() {
        return this.pickNumInnerReds()
            .pickBunkerTileTypes()
            .pickInnerRingTileTypes()
            .pickRedTiles()
            .assignRedTiles()
            .maybeDowngradeOtherWithGoodRed() // do before picking blue
            .pickBlueTiles()
            .maybeSwapInWormholes()
            .maybeSwapInLegendaries()
            .assignBlueTiles()
            .separateAnomalies()
            .generate();
    }

    /**
     * Override default player count.
     *
     * @param {number} playerCount
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    setPlayerCount(playerCount) {
        assert(typeof playerCount === "number");
        this._playerCount = playerCount;
        return this;
    }

    /**
     * Generate how many bunkers?
     *
     * @param {number} bunkerCount
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    setBunkerCount(bunkerCount) {
        assert(typeof bunkerCount === "number");
        this._bunkerCount = bunkerCount;
        return this;
    }

    /**
     * Choose how many red tiles to place in the inner ring.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    pickNumInnerReds() {
        this._numInnerReds = BunkerSliceGenerator._getNumInnerReds(
            this._playerCount
        );
        return this;
    }

    /**
     * Choose the four tile types for each bunker.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    pickBunkerTileTypes() {
        if (!this._numInnerReds) {
            throw new Error("must set inner red count first");
        }

        const bunkerTileTypesArray = BunkerSliceGenerator._getBunkerTileTypes(
            this._bunkerCount,
            this._numInnerReds
        );

        assert(!this._bunkers);
        this._bunkers = new Array(this._bunkerCount).fill(0).map(() => {
            return new Bunker();
        });

        // Fill in bunker entries.
        assert(this._bunkers.length === bunkerTileTypesArray.length);
        bunkerTileTypesArray.forEach((bunkerTileTypes, index) => {
            const bunker = this._bunkers[index];
            assert(bunker);
            assert(bunkerTileTypes.length === 4);
            bunkerTileTypes.forEach((tileType, index) => {
                const entry = bunker.getEntry(index);
                assert(typeof tileType === "string");
                assert(entry);
                entry.tileType = tileType;
            });
        });

        return this;
    }

    pickInnerRingTileTypes() {
        if (!this._numInnerReds) {
            throw new Error("must set inner red count first");
        }
        this._innerRingEntries = BunkerSliceGenerator._getInnerRingTileTypes(
            this._playerCount,
            this._numInnerReds
        ).map((tileType) => {
            return { tileType, tile: undefined };
        });
        return this;
    }

    /**
     * Choose the available red tiles to assign to inner ring, bunkers.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    pickRedTiles() {
        if (!this._numInnerReds) {
            throw new Error("must set inner red count first");
        }
        if (!this._bunkers) {
            throw new Error("must set bunker tile types first");
        }

        let numReds = this._numInnerReds;
        assert(Array.isArray(this._bunkers));
        for (const bunker of this._bunkers) {
            numReds += bunker.getNumReds();
        }

        assert(this._unused.red.length >= numReds);
        this._tiles.red = this._unused.red.slice(0, numReds);
        return this;
    }

    /**
     * Choose the available blue tiles to assign to inner ring, bunkers.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    pickBlueTiles() {
        if (!this._bunkers) {
            throw new Error("must set bunker tile types first");
        }
        if (!this._innerRingEntries) {
            throw new Error("must set inner ring tile types first");
        }

        const tileTypes = [];
        for (const entry of this._innerRingEntries) {
            tileTypes.push(entry.tileType);
        }
        for (const bunker of this._bunkers) {
            for (const entry of bunker.getEntries()) {
                tileTypes.push(entry.tileType);
            }
        }
        let numLow = 0,
            numMed = 0,
            numHigh = 0;
        for (const tileType of tileTypes) {
            if (tileType === TILE_TYPE.LOW) {
                numLow += 1;
            } else if (tileType === TILE_TYPE.MED) {
                numMed += 1;
            } else if (tileType === TILE_TYPE.HIGH) {
                numHigh += 1;
            } else if (tileType === TILE_TYPE.RED) {
                //numRed += 1;
            } else {
                throw new Error(`invalid type "${tileType}"`);
            }
        }

        // If a tier runs out, choose a lower tier or failing that upper.
        assert(this._tiles.high.length === 0);
        while (this._tiles.high.length < numHigh) {
            let tile;
            if (this._unused.high.length > 0) {
                tile = this._unused.high.shift();
            } else if (this._unused.med.length > 0) {
                tile = this._unused.med.shift();
            } else if (this._unused.low.length > 0) {
                tile = this._unused.low.shift();
            } else {
                throw new Error(
                    `no tiles available ${numLow}/${numMed}/${numHigh}`
                );
            }
            this._tiles.high.push(tile);
        }

        assert(this._tiles.med.length === 0);
        while (this._tiles.med.length < numMed) {
            let tile;
            if (this._unused.med.length > 0) {
                tile = this._unused.med.shift();
            } else if (this._unused.low.length > 0) {
                tile = this._unused.low.shift();
            } else if (this._unused.high.length > 0) {
                tile = this._unused.high.shift();
            } else {
                throw new Error(
                    `no tiles available ${numLow}/${numMed}/${numHigh}`
                );
            }
            this._tiles.med.push(tile);
        }

        assert(this._tiles.low.length === 0);
        while (this._tiles.low.length < numLow) {
            let tile;
            if (this._unused.low.length > 0) {
                tile = this._unused.low.shift();
            } else if (this._unused.med.length > 0) {
                tile = this._unused.med.shift();
            } else if (this._unused.high.length > 0) {
                tile = this._unused.high.shift();
            } else {
                throw new Error(
                    `no tiles available ${numLow}/${numMed}/${numHigh}`
                );
            }
            this._tiles.low.push(tile);
        }

        assert(this._tiles.low.length === numLow);
        assert(this._tiles.med.length === numMed);
        assert(this._tiles.high.length === numHigh);

        return this;
    }

    /**
     * Make sure at least two of each wormhole in available tiles.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    maybeSwapInWormholes() {
        const tiles = [];
        tiles.push(...this._tiles.low);
        tiles.push(...this._tiles.med);
        tiles.push(...this._tiles.high);

        let numAlpha = 0,
            numBeta = 0;
        for (const tile of tiles) {
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
            if (system.wormholes.includes("alpha")) {
                numAlpha += 1;
            }
            if (system.wormholes.includes("beta")) {
                numBeta += 1;
            }
        }

        const wantAlpha = BunkerSliceGenerator._weightedChoice(
            MIN_WORMHOLE_COUNT_DISTRIBUTION
        );
        const wantBeta = BunkerSliceGenerator._weightedChoice(
            MIN_WORMHOLE_COUNT_DISTRIBUTION
        );
        while (numAlpha < wantAlpha) {
            const success = BunkerSliceGenerator._promoteWormholeRandomizeTier(
                "alpha",
                this._tiles,
                this._unused
            );
            if (!success) {
                break;
            }
            numAlpha += 1;
        }
        while (numBeta < wantBeta) {
            const success = BunkerSliceGenerator._promoteWormholeRandomizeTier(
                "beta",
                this._tiles,
                this._unused
            );
            if (!success) {
                break;
            }
            numBeta += 1;
        }

        return this;
    }

    maybeSwapInLegendaries() {
        const tiles = [];
        tiles.push(...this._tiles.low);
        tiles.push(...this._tiles.med);
        tiles.push(...this._tiles.high);

        let numLegendary = 0;
        for (const tile of tiles) {
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
            if (system.raw.legendary) {
                numLegendary += 1;
            }
        }

        const want = BunkerSliceGenerator._weightedChoice(
            MIN_LEGENDARY_COUNT_DISTRIBUTION
        );
        while (numLegendary < want) {
            const success = BunkerSliceGenerator._promoteWormholeRandomizeTier(
                "legendary",
                this._tiles,
                this._unused
            );
            if (!success) {
                break;
            }
            numLegendary += 1;
        }

        return this;
    }

    /**
     * Fill in each bunker's red tiles, removing from available.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    assignRedTiles() {
        if (!this._bunkers) {
            throw new Error("must set bunker tile types first");
        }
        if (!this._innerRingEntries) {
            throw new Error("must set inner ring tile types first");
        }

        const redEntries = [];
        for (const entry of this._innerRingEntries) {
            if (entry.tileType === TILE_TYPE.RED) {
                redEntries.push(entry);
            }
        }
        for (const bunker of this._bunkers) {
            for (const entry of bunker.getEntries()) {
                if (entry.tileType === TILE_TYPE.RED) {
                    redEntries.push(entry);
                }
            }
        }

        assert(redEntries.length <= this._unused.red.length);
        for (const redEntry of redEntries) {
            assert(!redEntry.tile);
            redEntry.tile = this._unused.red.shift();
        }

        return this;
    }

    /**
     * If a bunker has a red tile with a planet, downgrade a blue tile.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    maybeDowngradeOtherWithGoodRed() {
        if (!this._bunkers) {
            throw new Error("must set bunker tile types first");
        }
        if (!this._innerRingEntries) {
            throw new Error("must set inner ring tile types first");
        }

        for (const bunker of this._bunkers) {
            const entries = bunker.getEntries();
            let downgrade = false;
            for (const entry of bunker.getEntries()) {
                if (entry.tileType === TILE_TYPE.RED) {
                    assert(entry.tile);
                    const system = world.TI4.getSystemByTileNumber(entry.tile);
                    if (system.planets.length > 0) {
                        downgrade = true;
                        break;
                    }
                }
            }
            if (downgrade) {
                const start = Math.floor(entries.length * Math.random());
                for (let offset = 0; offset < entries.length; offset++) {
                    const index = (start + offset) % entries.length;
                    const entry = entries[index];
                    assert(entry);
                    if (entry.tileType === TILE_TYPE.HIGH) {
                        entry.tileType = TILE_TYPE.MED;
                        break;
                    } else if (entry.tileType === TILE_TYPE.MED) {
                        entry.tileType = TILE_TYPE.LOW;
                        break;
                    }
                }
            }
        }

        return this;
    }

    /**
     * Assign blue tile numbers.
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    assignBlueTiles() {
        if (!this._bunkers) {
            throw new Error("must set bunker tile types first");
        }
        if (!this._innerRingEntries) {
            throw new Error("must set inner ring tile types first");
        }

        // Array of arrays, each is a connected set (bunker or inner ring).
        const entriesArray = [this._innerRingEntries];
        for (const bunker of this._bunkers) {
            entriesArray.push(bunker.getEntries());
        }

        // Use a random fill order because if choices consider what is already
        // used versus what is available later ones will be more constrained.
        const processOrders = [];
        for (const entries of entriesArray) {
            for (const entry of entries) {
                processOrders.push({ entries, entry });
            }
        }
        Shuffle.shuffle(processOrders);

        for (const { entries, entry } of processOrders) {
            if (entry.tileType === TILE_TYPE.HIGH) {
                assert(!entry.tile);
                entry.tile =
                    BunkerSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.high
                    );
                assert(entry.tile);
            } else if (entry.tileType === TILE_TYPE.MED) {
                assert(!entry.tile);
                entry.tile =
                    BunkerSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.med
                    );
                assert(entry.tile);
            } else if (entry.tileType === TILE_TYPE.LOW) {
                assert(!entry.tile);
                entry.tile =
                    BunkerSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.low
                    );
                assert(entry.tile);
            } else if (entry.tileType === TILE_TYPE.RED) {
                assert(entry.tile);
            } else {
                throw new Error("invalid type");
            }
        }

        return this;
    }

    /**
     * Separate anomalies (makes and effort, can possibly lead to invalid result)
     *
     * @returns {BunkerSliceGenerator} self, for chaining
     */
    separateAnomalies() {
        BunkerSliceGenerator._separateAnomalies(this._innerRingEntries);
        for (const bunker of this._bunkers) {
            BunkerSliceGenerator._separateAnomalies(bunker.getEntries());
        }
        return this;
    }

    generate() {
        let innerRing = this._innerRingEntries.map((entry) => entry.tile);

        // The inner ring always has 6 entries.
        // Inject -1 for empty sectors.
        if (innerRing.length === 5) {
            innerRing = [
                innerRing[0],
                innerRing[1],
                innerRing[2],
                -1,
                innerRing[3],
                innerRing[4],
            ];
        } else if (innerRing.length === 4) {
            innerRing = [
                -1,
                innerRing[0],
                innerRing[1],
                -1,
                innerRing[2],
                innerRing[3],
            ];
        } else if (innerRing.length === 3) {
            innerRing = [-1, innerRing[0], -1, innerRing[1], -1, innerRing[2]];
        } else if (innerRing.length === 2) {
            innerRing = [innerRing[0], -1, -1, innerRing[1], -1, -1];
        }

        return {
            bunkers: this._bunkers.map((bunker) => {
                return bunker.getEntries().map((entry) => entry.tile);
            }),
            innerRing,
        };
    }
}

module.exports = { BunkerSliceGenerator, TILE_TYPE };
