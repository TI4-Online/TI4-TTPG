const assert = require("../../../wrapper/assert-wrapper");
const { Hex } = require("../../hex");
const { world } = require("../../../wrapper/api");
const { Shuffle } = require("../../shuffle");
const { AbstractUtil } = require("./abstract-util");

//const { HIGH, MED, LOW, RED } = world.TI4.SYSTEM_TIER;
const HIGH = "high";
const MED = "med";
const LOW = "low";
const RED = "red";
const RESOLVED = "resolved";

const SLICE_SHAPES = {
    bunker: [
        "<0,1,-1>", // right
        "<0,0,0>", // anchor
        "<1,0,-1>", // front
        "<1,1,-2>", // right-eq
        "<0,2,-2>", // right-far
    ],
    bunker_right: [
        "<0,2,-2>", // right-far
        "<0,0,0>", // anchor
        "<1,0,-1>", // front
        "<1,1,-2>", // right-eq
        "<0,1,-1>", // right
    ],
    bunker_fixed: [
        "<2,0,-2>", // front-far
    ],
    bunker_fixed_7p_seatIndex3: [
        "<3,-1,-2>", // front-far (pushed forward)
    ],

    milty: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ],
    milty_7p_seatIndex3: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<2,0,-2>", // front (pushed forward)
        "<1,0,-1>", // right (pushed forward)
        "<2,-1,-1>", // left-eq
        "<3,-1,-2>", // front-far (pushed forward)
    ],

    milty_eq: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,0,-2>", // front-far
    ],
    milty_eq_7p_seatIndex3: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<2,0,-2>", // front (pushed forward)
        "<1,0,-1>", // right (pushed forward)
        "<3,-1,-2>", // front-far (pushed forward)
    ],
    milty_eq_fixed: [
        "<2,-1,-1>", // left-eq
    ],
};

class AbstractSliceGenerator {
    static parseCustomSlices(custom, shape, errors) {
        assert(typeof custom === "string");
        assert(Array.isArray(errors));

        const descriminator = "slices=";

        // Slices can appear at the beginning without a descriminator.
        custom = custom.trim();
        if (Number.parseInt(custom[0])) {
            custom = descriminator + custom;
        }

        const parts = custom
            .split("&")
            .map((part) => {
                return part.trim().toLowerCase();
            })
            .filter((part) => {
                return part.startsWith(descriminator);
            });
        if (parts.length === 0) {
            return false; // none given
        }

        let items = parts[0]
            .substring(descriminator.length)
            .split("|")
            .map((item) => {
                return item.trim().split(",");
            });

        // Validate (and convert slice tiles to numbers).
        const returnWarningInsteadOfThrow = true;
        items = items.filter((item) => {
            assert(Array.isArray(item));
            for (let i = 0; i < item.length; i++) {
                const tileStr = item[i];
                const tile = Number.parseInt(tileStr);
                if (Number.isNaN(tile)) {
                    errors.push(`Slice entry "${tileStr}" is not a number`);
                    return false;
                }
                item[i] = tile;
            }

            const err = AbstractUtil.assertIsSlice(
                item,
                shape,
                returnWarningInsteadOfThrow
            );
            if (err) {
                errors.push(err);
                return false;
            }
            return true;
        });

        return items;
    }

    static parseCustomLabels(custom, sliceCount, errors) {
        assert(typeof custom === "string");
        assert(typeof sliceCount === "number");
        assert(Array.isArray(errors));

        const descriminator = "labels=";
        const parts = custom
            .split("&")
            .map((part) => {
                return part.trim();
            })
            .filter((part) => {
                return part.startsWith(descriminator);
            });
        if (parts.length === 0) {
            return false; // none given
        }

        let items = parts[0]
            .substring(descriminator.length)
            .split("|")
            .map((item) => {
                return item.trim();
            });

        // Validate.
        if (items.length !== sliceCount) {
            const err = `label count (${items.length}) does not match slice count (${sliceCount})`;
            errors.push(err);
        }

        return items;
    }

    constructor() {
        this._count = this.getDefaultCount();
    }

    /**
     * What is the minimum number to offer? (draft setup slider min)
     * Must be at least world.TI4.config.playerCount.
     *
     * @returns {number}
     */
    getMinCount() {
        return world.TI4.config.playerCount;
    }

    /**
     * What is the maximum number to offer? (draft setup slider max)
     * Outer layer might impose a cap to conserve UI size.
     *
     * @returns {number}
     */
    getMaxCount() {
        return world.TI4.config.playerCount + 3;
    }

    /**
     * Where should the slicer be set initially?
     * @returns {number}
     */
    getDefaultCount() {
        return world.TI4.config.playerCount + 2;
    }

    getCount() {
        return this._count;
    }

    setCount(value) {
        assert(typeof value === "number");
        assert(value >= this.getMinCount());
        assert(value <= this.getMaxCount());
        this._count = value;
        return this;
    }

    /**
     * Slice tile positions relative to anchor.
     *
     *
     *         <+2,-3,+1>      <+1,-1,+0>        <+0,+1,-1>     <-1,3,-2>
     * <+2,-4,+2>      <+1,-2,+1>       <+0,+0,+0>       <-1,2-1>      <-2,+4,-2>
     *
     * @returns {Array.{string}} - list of hexes with slice pointing north, home is first entry then in slice order
     */
    getSliceShape() {
        throw new Error("subclass must override this");
    }

    /**
     * Generate slices, arrays of system tile numbers.
     *
     * @param {number} sliceCount
     * @returns {Array.{Array.{number}}}
     */
    generateSlices(sliceCount) {
        throw new Error("subclass must override this");
    }

    static _hasAdjacentAnomalies(slice, shape) {
        AbstractUtil.assertIsSlice(slice, shape);
        AbstractUtil.assertIsShape(shape);

        const hexIsAnomalySet = new Set();
        for (let i = 0; i < slice.length; i++) {
            const hex = shape[i + 1]; // first is home system
            const tile = slice[i];
            const system = world.TI4.getSystemByTileNumber(tile);
            if (system && system.anomalies.length > 0) {
                hexIsAnomalySet.add(hex);
            }
        }
        for (const hex of shape) {
            if (!hexIsAnomalySet.has(hex)) {
                continue;
            }
            for (const adj of Hex.neighbors(hex)) {
                if (hexIsAnomalySet.has(adj)) {
                    return true;
                }
            }
        }
    }

    static _separateAnomalies(slice, shape) {
        AbstractUtil.assertIsShape(shape);
        AbstractUtil.assertIsSlice(slice, shape);

        slice = [...slice]; // work with a copy

        // First, shuffle a few times and see if we get a good setup.
        // Give up after a reasonable number of tries.
        for (let i = 0; i < 20; i++) {
            if (!AbstractSliceGenerator._hasAdjacentAnomalies(slice, shape)) {
                return slice;
            }
            Shuffle.shuffle(slice);
        }

        // No luck.  Walk through slice permutations and use the first good one.
        // (This always fixes the same way, hence a few random stabs before this.)
        const inspector = (candidate) => {
            return !AbstractSliceGenerator._hasAdjacentAnomalies(
                candidate,
                shape
            );
        };
        const goodSlice = AbstractSliceGenerator._permutator(slice, inspector);
        if (goodSlice) {
            slice = goodSlice;
        }

        return slice;
    }

    /**
     * Walk all permutations of an array, calling inspector for each.
     * Stop and return first permutation that gets a truthy inspector result.
     *
     * @param {Array.{x}} array
     * @param {function} inspector - takes permuted array, return true to use it
     * @returns {x} Array element
     */
    static _permutator(array, inspector) {
        assert(Array.isArray(array));
        assert(typeof inspector === "function");

        // https://stackoverflow.com/questions/9960908/permutations-in-javascript
        let result = undefined;
        const permute = (arr, m = []) => {
            if (arr.length === 0) {
                const success = inspector(m);
                if (success) {
                    result = m;
                }
            } else {
                for (let i = 0; i < arr.length; i++) {
                    let curr = arr.slice();
                    let next = curr.splice(i, 1);
                    permute(curr.slice(), m.concat(next));
                    // Stop after first success.
                    if (result) {
                        break;
                    }
                }
            }
        };
        permute(array);
        return result;
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
            assert(option.value !== undefined);
        });
        let total = 0;
        for (const option of options) {
            total += option.weight;
        }
        let target = Math.random() * total;
        for (const option of options) {
            if (target <= option.weight) {
                let result = option.value;
                if (Array.isArray(result)) {
                    result = [...result]; // shallow copy
                }
                return result;
            }
            target -= option.weight;
        }
        throw new Error("unreachable");
    }

    /**
     * Get an array of matching tiles.
     *
     * @param {*} tieredTiles
     * @param {function} filter
     * @returns {Array.{number}}
     */
    static _getMatchingTiles(tieredTiles, filter) {
        const matchingTiles = [];
        const runForTier = (tileArray) => {
            for (let i = 0; i < tileArray.length; i++) {
                const tile = tileArray[i];
                const system = world.TI4.getSystemByTileNumber(tile);
                if (!system) {
                    throw new Error(`no system for tile ${tile}`);
                }
                if (filter(system)) {
                    matchingTiles.push(tile);
                }
            }
        };
        runForTier(tieredTiles.high);
        runForTier(tieredTiles.med);
        runForTier(tieredTiles.low);
        runForTier(tieredTiles.red);
        return matchingTiles;
    }

    static _getAllWormholeTiles(tieredTiles) {
        return AbstractSliceGenerator._getMatchingTiles(
            tieredTiles,
            (system) => {
                return system.wormholes.length > 0;
            }
        );
    }

    static _getAllLegendaryTiles(tieredTiles) {
        return AbstractSliceGenerator._getMatchingTiles(
            tieredTiles,
            (system) => {
                return system.legendary;
            }
        );
    }

    /**
     * Move the tile from remaining to chosen.
     *
     * @param {number} tile
     * @param {*} chosenTiles
     * @param {*} remainingTiles
     */
    static _promote(tile, chosenTiles, remainingTiles) {
        const runForTier = (tile, dstArray, srcArray) => {
            const srcIdx = srcArray.indexOf(tile);
            if (srcIdx >= 0) {
                srcArray.splice(srcIdx, 1); // remove from src
                dstArray.unshift(tile); // add to front of dst
            }
        };
        runForTier(tile, chosenTiles.high, remainingTiles.high);
        runForTier(tile, chosenTiles.med, remainingTiles.med);
        runForTier(tile, chosenTiles.low, remainingTiles.low);
        runForTier(tile, chosenTiles.red, remainingTiles.red);
    }

    static _getRandomTieredSystemsWithLegendaryWormholePromotion(options) {
        assert(typeof options === "object");
        assert(typeof options.minWormholes === "number");
        assert(typeof options.minLegendary === "number");

        const remainingTiles = world.TI4.System.getAllTileNumbersTiered();
        assert(Array.isArray(remainingTiles.high));
        assert(Array.isArray(remainingTiles.med));
        assert(Array.isArray(remainingTiles.low));
        assert(Array.isArray(remainingTiles.red));

        remainingTiles.high = Shuffle.shuffle(remainingTiles.high);
        remainingTiles.med = Shuffle.shuffle(remainingTiles.med);
        remainingTiles.low = Shuffle.shuffle(remainingTiles.low);
        remainingTiles.red = Shuffle.shuffle(remainingTiles.red);

        // Get the initial set, before promoting anything.
        const chosenTiles = {
            high: [],
            med: [],
            low: [],
            red: [],
        };

        // Promote wormholes
        let chosenWormholeCount =
            AbstractSliceGenerator._getAllWormholeTiles(chosenTiles).length;
        let remainingWormholeTiles =
            AbstractSliceGenerator._getAllWormholeTiles(remainingTiles);
        remainingWormholeTiles = Shuffle.shuffle(remainingWormholeTiles);
        while (
            chosenWormholeCount < options.minWormholes &&
            remainingWormholeTiles.length > 0
        ) {
            const tile = remainingWormholeTiles.pop();
            AbstractSliceGenerator._promote(tile, chosenTiles, remainingTiles);
            chosenWormholeCount += 1;
        }

        // Promote legendaries
        let chosenLegendaryCount =
            AbstractSliceGenerator._getAllLegendaryTiles(chosenTiles).length;
        let remainingLegendaryTiles =
            AbstractSliceGenerator._getAllLegendaryTiles(remainingTiles);
        remainingLegendaryTiles = Shuffle.shuffle(remainingLegendaryTiles);
        while (
            chosenLegendaryCount < options.minLegendary &&
            remainingLegendaryTiles.length > 0
        ) {
            const tile = remainingLegendaryTiles.pop();
            AbstractSliceGenerator._promote(tile, chosenTiles, remainingTiles);
            chosenLegendaryCount += 1;
        }

        // Shuffle everything!
        chosenTiles.high = Shuffle.shuffle(chosenTiles.high);
        chosenTiles.med = Shuffle.shuffle(chosenTiles.med);
        chosenTiles.low = Shuffle.shuffle(chosenTiles.low);
        chosenTiles.red = Shuffle.shuffle(chosenTiles.red);
        remainingTiles.high = Shuffle.shuffle(remainingTiles.high);
        remainingTiles.med = Shuffle.shuffle(remainingTiles.med);
        remainingTiles.low = Shuffle.shuffle(remainingTiles.low);
        remainingTiles.red = Shuffle.shuffle(remainingTiles.red);

        return { chosenTiles, remainingTiles };
    }

    /**
     * Spread the required tiles (wormholes and legendaries) across slices.
     *
     * The "tieredSlices" have HIGH/MED/LOW/RED values.
     *
     * @param {Array.{Array.{string}}} tieredSlices
     * @param {Object} chosenTiles
     * @param {Array.{Array.{number}}} slices
     */
    static _fillSlicesWithRequiredTiles(tieredSlices, chosenTiles, slices) {
        assert(Array.isArray(tieredSlices));
        assert(Array.isArray(chosenTiles.high));
        assert(Array.isArray(chosenTiles.med));
        assert(Array.isArray(chosenTiles.low));
        assert(Array.isArray(chosenTiles.red));
        assert(Array.isArray(slices));

        // Make sure all slices are same length.
        const sliceLength = tieredSlices[0].length;
        for (const tieredSlice of tieredSlices) {
            assert(tieredSlice.length === sliceLength);
        }

        const numSlices = tieredSlices.length;

        // Add empty lists for slices.
        while (slices.length < numSlices) {
            slices.push([]);
        }

        // Spread already chosen tiles around.
        const tryAdd = (addTier) => {
            // Find the slice with the fewest entries that will take this tier.
            let bestSliceIndex = undefined;
            let bestTileIndex = undefined;
            let bestCount = undefined;
            for (let sliceIndex = 0; sliceIndex < numSlices; sliceIndex++) {
                const tieredSlice = tieredSlices[sliceIndex];
                for (let tileIndex = 0; tileIndex < sliceLength; tileIndex++) {
                    const tileTier = tieredSlice[tileIndex];
                    assert(tileTier);
                    if (tileTier !== addTier) {
                        continue;
                    }
                    const slice = slices[sliceIndex];
                    assert(slice);
                    const count = slice.length;
                    if (bestCount === undefined || count < bestCount) {
                        bestSliceIndex = sliceIndex;
                        bestTileIndex = tileIndex;
                        bestCount = count;
                    }
                }
            }
            if (bestCount !== undefined) {
                const tieredSlice = tieredSlices[bestSliceIndex];
                assert(tieredSlice);
                const slice = slices[bestSliceIndex];
                assert(slice);

                // Double check correct tier.
                const tileTier = tieredSlice[bestTileIndex];
                assert(tileTier === addTier);

                // Move tile to slice.
                const tile = chosenTiles[addTier].pop();
                assert(tile !== undefined);
                slice.push(tile);
                tieredSlice[bestTileIndex] = RESOLVED;
                return true;
            }
            return false;
        };

        while (chosenTiles.high.length > 0) {
            if (!tryAdd(HIGH)) {
                break;
            }
        }
        while (chosenTiles.med.length > 0) {
            if (!tryAdd(MED)) {
                break;
            }
        }
        while (chosenTiles.low.length > 0) {
            if (!tryAdd(LOW)) {
                break;
            }
        }
        while (chosenTiles.red.length > 0) {
            if (!tryAdd(RED)) {
                break;
            }
        }
    }

    /**
     * Add remaining tiles, attempt to balance slices.
     *
     * The "tieredSlices" have HIGH/MED/LOW/RED values.
     *
     * @param {Array.{Array.{string}}} tieredSlices
     * @param {Object} chosenTiles
     * @param {Array.{Array.{number}}} slices
     */
    static _fillSlicesWithRemainingTiles(tieredSlices, remainingTiles, slices) {
        assert(Array.isArray(tieredSlices));
        assert(Array.isArray(remainingTiles.high));
        assert(Array.isArray(remainingTiles.med));
        assert(Array.isArray(remainingTiles.low));
        assert(Array.isArray(remainingTiles.red));
        assert(Array.isArray(slices));

        // Make sure all slices are same length.
        const sliceLength = tieredSlices[0].length;
        for (const tieredSlice of tieredSlices) {
            assert(tieredSlice.length === sliceLength);
        }

        // Slices probably exist here, but just in case add empty lists for slices.
        while (slices.length < tieredSlices.length) {
            slices.push([]);
        }

        // Fill red tiles randomly, do not account for res/inf (otherwise would
        // pull in those systems more frequencly than others).
        for (let tileIndex = 0; tileIndex < sliceLength; tileIndex++) {
            for (
                let sliceIndex = 0;
                sliceIndex < tieredSlices.length;
                sliceIndex++
            ) {
                const tieredSlice = tieredSlices[sliceIndex];
                const tier = tieredSlice[tileIndex];
                if (tier !== RED) {
                    continue;
                }
                let takeFrom = remainingTiles.red;
                if (takeFrom.length === 0) {
                    if (remainingTiles.low.length > 0) {
                        takeFrom = remainingTiles.low;
                    } else if (remainingTiles.med.length > 0) {
                        takeFrom = remainingTiles.med;
                    } else if (remainingTiles.high.length > 0) {
                        takeFrom = remainingTiles.high;
                    } else if (remainingTiles.red.length > 0) {
                        takeFrom = remainingTiles.red;
                    } else {
                        throw new Error("no tiles remain???");
                    }
                }
                const tile = takeFrom.pop();
                const slice = slices[sliceIndex];
                assert(slice);
                slice.push(tile);
                tieredSlice[tileIndex] = RESOLVED;
            }
        }

        // Fill rest with remaining tiles.
        // Use weighted selection to try to balance things.
        for (let tileIndex = 0; tileIndex < sliceLength; tileIndex++) {
            for (
                let sliceIndex = 0;
                sliceIndex < tieredSlices.length;
                sliceIndex++
            ) {
                const tieredSlice = tieredSlices[sliceIndex];
                const tier = tieredSlice[tileIndex];
                if (tier === RESOLVED) {
                    continue;
                }

                // We need to fill the slice.  If no tiles remain in the desired
                // tier, select a different one with availability.
                let takeFrom = remainingTiles[tier];
                if (!takeFrom) {
                    throw new Error(
                        `no takeFrom for "${tier}" (tile index ${tileIndex})`
                    );
                }
                if (takeFrom.length === 0) {
                    if (remainingTiles.low.length > 0) {
                        takeFrom = remainingTiles.low;
                    } else if (remainingTiles.med.length > 0) {
                        takeFrom = remainingTiles.med;
                    } else if (remainingTiles.high.length > 0) {
                        takeFrom = remainingTiles.high;
                    } else if (remainingTiles.red.length > 0) {
                        takeFrom = remainingTiles.red;
                    } else {
                        throw new Error("no tiles remain???");
                    }
                }

                const slice = slices[sliceIndex];
                assert(slice);
                const {
                    res,
                    optRes,
                    inf,
                    optInf,
                    tech,
                    wormholes,
                    legendaries,
                } = world.TI4.System.summarizeRaw(slice);
                const hasWormhole = wormholes.length > 0;
                const lasLegendary = legendaries.length > 0;
                const hasTech = tech.length > 0;

                const choices = [];
                for (
                    let takeFromIndex = 0;
                    takeFromIndex < takeFrom.length;
                    takeFromIndex++
                ) {
                    const tile = takeFrom[takeFromIndex];
                    assert(tile);
                    const system = world.TI4.getSystemByTileNumber(tile);
                    assert(system);

                    // TODO calculate weight for balance.

                    choices.push({ weight: 1, value: { tile, takeFromIndex } });
                }

                // Move the chosen tile to the slice.
                const { tile, takeFromIndex } =
                    AbstractSliceGenerator._weightedChoice(choices);
                takeFrom.splice(takeFromIndex, 1);
                slice.push(tile);
                tieredSlice[tileIndex] = RESOLVED;
            }
        }
    }
}

module.exports = { AbstractSliceGenerator, SLICE_SHAPES };
