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

// Make these top-level constants for cleaner arrays when used.
const RED = "red";
const HIGH = "high";
const MED = "med";
const LOW = "low";

// These are the equidistant planets.
const EQS_CHOICES = [
    // 3 red
    { weight: 5 + 1, value: [RED, RED, RED, HIGH, MED, LOW] }, // 6
    { weight: 5 + 2, value: [RED, RED, RED, HIGH, LOW, LOW] }, // 5
    { weight: 5 + 3, value: [RED, RED, RED, MED, MED, LOW] }, // 5
    { weight: 5 + 2, value: [RED, RED, RED, MED, LOW, LOW] }, // 4
    { weight: 5 + 1, value: [RED, RED, RED, LOW, LOW, LOW] }, // 3

    // 2 red
    { weight: 8 + 1, value: [RED, RED, HIGH, MED, LOW, LOW] }, // 7
    { weight: 8 + 2, value: [RED, RED, HIGH, LOW, LOW, LOW] }, // 6
    { weight: 8 + 3, value: [RED, RED, MED, MED, LOW, LOW] }, // 6
    { weight: 8 + 2, value: [RED, RED, MED, LOW, LOW, LOW] }, // 5
    { weight: 8 + 1, value: [RED, RED, LOW, LOW, LOW, LOW] }, // 4

    // 1 red
    { weight: 5 + 1, value: [RED, LOW, MED, MED, LOW, LOW] }, // 7
    { weight: 5 + 2, value: [RED, LOW, MED, LOW, LOW, LOW] }, // 6
    { weight: 5 + 3, value: [RED, LOW, LOW, MED, LOW, LOW] }, // 6
    { weight: 5 + 2, value: [RED, LOW, LOW, LOW, LOW, LOW] }, // 5
    { weight: 5 + 1, value: [RED, LOW, LOW, LOW, LOW, LOW] }, // 4
];

const BUNKER_CHOICES = [
    // 2 red
    { weight: 2, value: [RED, RED, HIGH, HIGH] }, // 6
    { weight: 3, value: [RED, RED, HIGH, MED] }, // 5
    { weight: 1, value: [RED, RED, MED, MED] }, // 4

    // 1 red
    { weight: 2, value: [RED, HIGH, MED, LOW] }, // 6
    { weight: 3, value: [RED, HIGH, LOW, LOW] }, // 5
    { weight: 2, value: [RED, MED, MED, LOW] }, // 5
    { weight: 1, value: [RED, MED, LOW, LOW] }, // 4
];

const MIN_WORMHOLE_CHOICES = [
    { weight: 1, value: 2 },
    { weight: 1, value: 3 },
];

const MIN_LEGENDARY_CHOICES = [
    { weight: 1, value: 1 },
    { weight: 1, value: 2 },
];

/**
 * Information about one slice.
 */
class EqSlice {
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
}

/**
 * An "EqSlice" is four systems wrapped around a home system.
 * There are a series of equidistant systems.
 */
class MiltyEqSliceGenerator {
    static get minCount() {
        return world.TI4.config.playerCount;
    }

    static get maxCount() {
        return 8; // milty draft max is 9, smaller b/c may run out of HIGH tiles
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
     * Which tile tiers make up the inner ring?
     *
     * @return {Array.{string}}
     */
    static _chooseEqsTileTypes(playerCount) {
        assert(typeof playerCount === "number");
        let result = MiltyEqSliceGenerator._weightedChoice(EQS_CHOICES);
        result = [...result]; // return a copy
        result = Shuffle.shuffle(result);
        while (result.length > playerCount) {
            result.shift();
        }
        return result;
    }

    /**
     * Which tile tiers make up a single slice?
     *
     * @return {Array.{string}}
     */
    static _chooseOneSliceTileTypes() {
        let result = MiltyEqSliceGenerator._weightedChoice(BUNKER_CHOICES);
        result = [...result]; // return a copy
        return Shuffle.shuffle(result);
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
     * @param {Object.{high,med.low}} actives - tile numbers available for use
     * @param {Object.{high,med.low}} unuseds - unused tile numbers
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

        const tiers = Shuffle.shuffle([HIGH, MED, LOW, RED]);
        for (const tier of tiers) {
            let active, unused;
            if (tier === HIGH) {
                active = actives.high;
                unused = unuseds.high;
            } else if (tier === MED) {
                active = actives.med;
                unused = unuseds.med;
            } else if (tier === LOW) {
                active = actives.low;
                unused = unuseds.low;
            } else if (tier === RED) {
                active = actives.red;
                unused = unuseds.red;
            } else {
                throw new Error("invalid type");
            }
            if (
                MiltyEqSliceGenerator._promoteWormhole(
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
     * @param {Array.{Object.{tileType,tile}}} entries - slice or inner ring
     * @param {Array.{number}} availableTiles - choose from this collection
     * @returns {number} - tile from availableTiles
     */
    static _chooseAndRemoveFromAvailableTiles(entries, availableTiles) {
        assert(Array.isArray(entries));
        assert(Array.isArray(availableTiles));

        let entriesBlue = 0;
        let entriesPlanetCount = 0;
        let entriesRes = 0;
        let entriesInf = 0;
        let entriesWormhole = false;
        let entriesLegendary = false;
        const entriesTraitSet = new Set();
        const entriesTechSet = new Set();
        for (const entry of entries) {
            if (entry.tile) {
                const system = world.TI4.getSystemByTileNumber(entry.tile);
                if (system.blue) {
                    entriesBlue += 1;
                }
                for (const planet of system.planets) {
                    entriesPlanetCount += 1;
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
        const avgPlanets = entriesPlanetCount / Math.max(1, entriesBlue);
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

            // If average planet count is low favor higher planet counts.
            if (avgPlanets < 1.4 && system.planets.length > 1) {
                weight += 5;
            }

            // Likewise if planet count is high favor fewer.
            if (avgPlanets > 1.6 && system.planets.length <= 1) {
                weight += 5;
            }

            // If more res than inf, favor inf and vice versa.
            const isRes = res > inf;
            if (isRes != entryIsRes) {
                weight += 3;
            }

            // Prefer tech and trait diversity.
            if (!techOverlap) {
                weight += 1;
            }
            if (!traitOverlap) {
                weight += 1;
            }

            // Avoid doubles.
            if (entriesWormhole && wormhole) {
                weight = 0.001;
            }
            if (entriesLegendary && legendary) {
                weight = 0.001;
            }

            choices.push({ weight, value: tile });
        }

        const tile = MiltyEqSliceGenerator._weightedChoice(choices);
        const index = availableTiles.indexOf(tile);
        assert(index >= 0);
        availableTiles.splice(index, 1);

        return tile;
    }

    static _separateAnomalies(entries) {
        assert(Array.isArray(entries));
        assert(entries.length === 4);

        // Order is left, front, right, far-front.
        const center = entries[1];
        const centerSystem = world.TI4.getSystemByTileNumber(center.tile);
        const centerA = centerSystem.anomalies.length > 0;
        if (!centerA) {
            return; // center is safe
        }

        const left = entries[0];
        const leftSystem = world.TI4.getSystemByTileNumber(left.tile);
        const leftA = leftSystem.anomalies.length > 0;

        const right = entries[2];
        const rightSystem = world.TI4.getSystemByTileNumber(right.tile);
        const rightA = rightSystem.anomalies.length > 0;

        const far = entries[3];
        const farSystem = world.TI4.getSystemByTileNumber(far.tile);
        const farA = farSystem.anomalies.length > 0;

        if (leftA) {
            if (Math.random() < 0.5) {
                entries[2] = center;
                entries[1] = right;
            } else {
                entries[3] = center;
                entries[1] = far;
            }
        }
        if (rightA) {
            if (Math.random() < 0.5) {
                entries[0] = center;
                entries[1] = left;
            } else {
                entries[3] = center;
                entries[1] = far;
            }
        }
        if (farA) {
            if (Math.random() < 0.5) {
                entries[0] = center;
                entries[1] = left;
            } else {
                entries[2] = center;
                entries[1] = right;
            }
        }
    }

    static _maybeFixBadSlice(slice, reserve) {
        assert(slice instanceof EqSlice);
        assert(slice.getEntries().length === 4);
        assert(typeof reserve === "object");
        assert(Array.isArray(reserve.low));
        assert(Array.isArray(reserve.med));
        assert(Array.isArray(reserve.high));

        const tiles = slice.getEntries().map((entry) => entry.tile);

        let res = 0;
        let inf = 0;
        let planetCount = 0;
        let reds = [];
        for (const tile of tiles) {
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
            if (system.red) {
                reds.push(tile);
            }
            for (const planet of system.planets) {
                res += planet.raw.resources;
                inf += planet.raw.influence;
                planetCount += 1;
            }
        }

        console.log(
            JSON.stringify({
                res,
                inf,
                planetCount,
                reds: reds.length,
                high: reserve.high.length,
                med: reserve.med.length,
                low: reserve.low.length,
            })
        );
    }

    constructor() {
        this.reset();
    }

    reset() {
        this._playerCount = world.TI4.config.playerCount;
        this._sliceCount = Math.min(
            world.TI4.config.playerCount + 2,
            MiltyEqSliceGenerator.maxCount
        );
        this._slices = undefined; // {Array.{Slice}}
        this._eqsEntries = undefined; // {Array.{tileType:string,tile:number}}

        // Tiles not (yet) used in any slice or inner ring.
        this._unused = {
            high: Shuffle.shuffle([...TILE_TIERS.high]),
            med: Shuffle.shuffle([...TILE_TIERS.med]),
            low: Shuffle.shuffle([...TILE_TIERS.low]),
            red: Shuffle.shuffle(MiltyEqSliceGenerator._getRedTileNumbers()),
        };

        // Tiles available for use, sized to number needed.
        this._tiles = {
            high: [],
            med: [],
            low: [],
            red: [],
        };
    }

    getSliceCount() {
        return this._sliceCount;
    }

    /**
     * Simple endpoint to run the full generator.
     *
     * @param {number} sliceCount
     * @returns {Object.{slices,eqs}}
     */
    simpleGenerate() {
        return this.pickEqsTileTypes()
            .pickSliceTileTypes()
            .pickRedTiles()
            .assignRedTiles()
            .maybeDowngradeOtherWithGoodRed() // do before picking blue
            .pickBlueTiles()
            .maybeSwapInWormholes()
            .maybeSwapInLegendaries()
            .assignBlueTiles()
            .separateAnomalies()
            .fixBadSlices()
            .generate();
    }

    /**
     * Override default player count.
     *
     * @param {number} playerCount
     * @returns {MiltyEqGenerator} self, for chaining
     */
    setPlayerCount(playerCount) {
        assert(typeof playerCount === "number");
        this._playerCount = playerCount;
        return this;
    }

    /**
     * Generate how many slices?
     *
     * @param {number} sliceCount
     * @returns {MiltyEqGenerator} self, for chaining
     */
    setSliceCount(sliceCount) {
        assert(typeof sliceCount === "number");
        this._sliceCount = sliceCount;
        return this;
    }

    /**
     * Choose how many red tiles to place in the inner ring.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    pickEqsTileTypes() {
        const innerRedTileTypes = MiltyEqSliceGenerator._chooseEqsTileTypes(
            this._playerCount
        );
        this._eqsEntries = innerRedTileTypes.map((tileType) => {
            assert(typeof tileType === "string");
            return {
                tileType,
                tile: undefined,
            };
        });
        return this;
    }

    /**
     * Choose the four tile types for each slice.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    pickSliceTileTypes() {
        assert(!this._slices);
        this._slices = new Array(this._sliceCount).fill(0).map(() => {
            return new EqSlice();
        });

        // Fill in slice entries.
        for (const slice of this._slices) {
            const sliceTileTypes =
                MiltyEqSliceGenerator._chooseOneSliceTileTypes();
            assert(sliceTileTypes.length === 4);
            sliceTileTypes.forEach((tileType, index) => {
                const entry = slice.getEntry(index);
                assert(typeof tileType === "string");
                assert(entry);
                entry.tileType = tileType;
            });
        }

        return this;
    }

    /**
     * Choose the available red tiles to assign to inner ring, slices.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    pickRedTiles() {
        if (!this._slices) {
            throw new Error("must set slice tile types first");
        }

        let numReds = 0;
        const tileTypes = [];
        for (const entry of this._eqsEntries) {
            tileTypes.push(entry.tileType);
        }
        for (const slice of this._slices) {
            for (const entry of slice.getEntries()) {
                tileTypes.push(entry.tileType);
            }
        }
        for (const tileType of tileTypes) {
            if (tileType === "RED") {
                numReds += 1;
            }
        }

        assert(this._unused.red.length >= numReds);
        this._tiles.red = this._unused.red.slice(0, numReds);
        return this;
    }

    /**
     * Choose the available blue tiles to assign to inner ring, slices.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    pickBlueTiles() {
        if (!this._slices) {
            throw new Error("must set slice tile types first");
        }
        if (!this._eqsEntries) {
            throw new Error("must set inner ring tile types first");
        }

        const tileTypes = [];
        for (const entry of this._eqsEntries) {
            tileTypes.push(entry.tileType);
        }
        for (const slice of this._slices) {
            for (const entry of slice.getEntries()) {
                tileTypes.push(entry.tileType);
            }
        }
        let numLow = 0,
            numMed = 0,
            numHigh = 0;
        for (const tileType of tileTypes) {
            if (tileType === LOW) {
                numLow += 1;
            } else if (tileType === MED) {
                numMed += 1;
            } else if (tileType === HIGH) {
                numHigh += 1;
            } else if (tileType === RED) {
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
     * @returns {MiltyEqGenerator} self, for chaining
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

        const wantAlpha =
            MiltyEqSliceGenerator._weightedChoice(MIN_WORMHOLE_CHOICES);
        const wantBeta =
            MiltyEqSliceGenerator._weightedChoice(MIN_WORMHOLE_CHOICES);
        while (numAlpha < wantAlpha) {
            const success = MiltyEqSliceGenerator._promoteWormholeRandomizeTier(
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
            const success = MiltyEqSliceGenerator._promoteWormholeRandomizeTier(
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

        const want = MiltyEqSliceGenerator._weightedChoice(
            MIN_LEGENDARY_CHOICES
        );
        while (numLegendary < want) {
            const success = MiltyEqSliceGenerator._promoteWormholeRandomizeTier(
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
     * Fill in each slice's red tiles, removing from available.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    assignRedTiles() {
        if (!this._slices) {
            throw new Error("must set slice tile types first");
        }
        if (!this._eqsEntries) {
            throw new Error("must set inner ring tile types first");
        }

        const redEntries = [];
        for (const entry of this._eqsEntries) {
            if (entry.tileType === RED) {
                redEntries.push(entry);
            }
        }
        for (const slice of this._slices) {
            for (const entry of slice.getEntries()) {
                if (entry.tileType === RED) {
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
     * If a slice has a red tile with a planet, downgrade a blue tile.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    maybeDowngradeOtherWithGoodRed() {
        if (!this._slices) {
            throw new Error("must set slice tile types first");
        }
        if (!this._eqsEntries) {
            throw new Error("must set inner ring tile types first");
        }

        for (const slice of this._slices) {
            const entries = slice.getEntries();
            let downgrade = false;
            for (const entry of slice.getEntries()) {
                if (entry.tileType === RED) {
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
                    if (entry.tileType === HIGH) {
                        entry.tileType = MED;
                        break;
                    } else if (entry.tileType === MED) {
                        entry.tileType = LOW;
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
     * @returns {MiltyEqGenerator} self, for chaining
     */
    assignBlueTiles() {
        if (!this._slices) {
            throw new Error("must set slice tile types first");
        }
        if (!this._eqsEntries) {
            throw new Error("must set inner ring tile types first");
        }

        // Array of arrays, each is a connected set (slice or inner ring).
        const entriesArray = [this._eqsEntries];
        for (const slice of this._slices) {
            entriesArray.push(slice.getEntries());
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
            if (entry.tileType === HIGH) {
                assert(!entry.tile);
                entry.tile =
                    MiltyEqSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.high
                    );
                assert(entry.tile);
            } else if (entry.tileType === MED) {
                assert(!entry.tile);
                entry.tile =
                    MiltyEqSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.med
                    );
                assert(entry.tile);
            } else if (entry.tileType === LOW) {
                assert(!entry.tile);
                entry.tile =
                    MiltyEqSliceGenerator._chooseAndRemoveFromAvailableTiles(
                        entries,
                        this._tiles.low
                    );
                assert(entry.tile);
            } else if (entry.tileType === RED) {
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
     * @returns {MiltyEqGenerator} self, for chaining
     */
    separateAnomalies() {
        for (const slice of this._slices) {
            MiltyEqSliceGenerator._separateAnomalies(slice.getEntries());
        }
        return this;
    }

    /**
     * If a slice is really awkward try to swap some tiles out.
     *
     * @returns {MiltyEqGenerator} self, for chaining
     */
    fixBadSlices() {
        for (const slice of this._slices) {
            MiltyEqSliceGenerator._maybeFixBadSlice(slice, this._unused);
        }
        return this;
    }

    generate() {
        let eqs = this._eqsEntries.map((entry) => entry.tile);
        return {
            slices: this._slices.map((slice) => {
                return slice.getEntries().map((entry) => entry.tile);
            }),
            eqs: eqs,
        };
    }
}

module.exports = { MiltyEqSliceGenerator, RED, HIGH, MED, LOW };
