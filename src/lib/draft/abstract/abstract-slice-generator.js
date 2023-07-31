const assert = require("../../../wrapper/assert-wrapper");
const { Hex } = require("../../hex");
const { world } = require("../../../wrapper/api");
const { Shuffle } = require("../../shuffle");
const { AbstractUtil } = require("./abstract-util");

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
        "<2,-1,-1>", // left-eq
    ],
    milty_eq_fixed: [
        "<2,0,-2>", // front-far
    ],
    milty_eq_fixed_7p_seatIndex3: [
        "<3,-1,-2>", // front-far (pushed forward)
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
     * Get an array of matching tiles, also shifting to the left in original.
     * (Shift so later adjustments can pop from the end with less chance of removing these.)
     *
     * @param {*} tieredTiles
     * @param {function} filter
     * @returns {Array.{number}}
     */
    static _getMatchingTilesAndShiftToFront(tieredTiles, filter) {
        const matchingTiles = [];
        const runForTier = (tileArray) => {
            for (let i = 0; i < tileArray.length; i++) {
                const tile = tileArray[i];
                const system = world.TI4.getSystemByTileNumber(tile);
                if (!system) {
                    throw new Error(`no system for tile ${tile}`);
                }
                if (filter(system)) {
                    tileArray.splice(i, 1); // remove from tieredTiles
                    tileArray.unshift(tile); // resturn to tieredTiles at front of list
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
        return AbstractSliceGenerator._getMatchingTilesAndShiftToFront(
            tieredTiles,
            (system) => {
                return system.wormholes.length > 0;
            }
        );
    }

    static _getAllLegendaryTiles(tieredTiles) {
        return AbstractSliceGenerator._getMatchingTilesAndShiftToFront(
            tieredTiles,
            (system) => {
                return system.legendary;
            }
        );
    }

    /**
     * Move the tile from remaining to chosen, pushing to the front of the list
     * then move the extra item from the end of chosen to remaining.
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
                srcArray.push(dstArray.pop()); // move excess from src to dst
            }
        };
        runForTier(tile, chosenTiles.high, remainingTiles.high);
        runForTier(tile, chosenTiles.med, remainingTiles.med);
        runForTier(tile, chosenTiles.low, remainingTiles.low);
        runForTier(tile, chosenTiles.red, remainingTiles.red);
    }

    static _getRandomTieredSystemsWithLegendaryWormholePromotion(options) {
        assert(typeof options === "object");
        assert(typeof options.high === "number");
        assert(typeof options.med === "number");
        assert(typeof options.low === "number");
        assert(typeof options.red === "number");
        assert(
            !options.minWormholes || typeof options.minWormholes === "number"
        );
        assert(
            !options.minLegendary || typeof options.minLegendary === "number"
        );

        const remainingTiles = world.TI4.System.getAllTileNumbersTiered();
        assert(Array.isArray(remainingTiles.high));
        assert(Array.isArray(remainingTiles.med));
        assert(Array.isArray(remainingTiles.low));
        assert(Array.isArray(remainingTiles.red));

        remainingTiles.high = Shuffle.shuffle(remainingTiles.high);
        remainingTiles.med = Shuffle.shuffle(remainingTiles.med);
        remainingTiles.low = Shuffle.shuffle(remainingTiles.low);
        remainingTiles.red = Shuffle.shuffle(remainingTiles.red);

        // Verify supply meets request.
        if (remainingTiles.high.length < options.high) {
            throw new Error("too few high");
        } else if (remainingTiles.med.length < options.high) {
            throw new Error("too few med");
        } else if (remainingTiles.low.length < options.high) {
            throw new Error("too few low");
        } else if (remainingTiles.red.length < options.high) {
            throw new Error("too few red");
        }

        // Get the initial set, before promoting anything.
        const chosenTiles = {
            high: remainingTiles.high.splice(0, options.high),
            med: remainingTiles.med.splice(0, options.med),
            low: remainingTiles.low.splice(0, options.low),
            red: remainingTiles.red.splice(0, options.red),
        };

        // Promote wormholes?
        if (options.minWormholes) {
            const chosenWormholeTiles =
                AbstractSliceGenerator._getAllWormholeTiles(chosenTiles);
            const remainingWormholeTiles =
                AbstractSliceGenerator._getAllWormholeTiles(remainingTiles);
            while (
                chosenWormholeTiles.length < options.minWormholes &&
                remainingWormholeTiles.length > 0
            ) {
                const tile = remainingWormholeTiles.pop();
                AbstractSliceGenerator._promote(
                    tile,
                    chosenTiles,
                    remainingTiles
                );
            }
        }

        // Promote legendaries?
        if (options.minLegendary) {
            const chosenLegendaryTiles =
                AbstractSliceGenerator._getAllLegendaryTiles(chosenTiles);
            const remainingLegendaryTiles =
                AbstractSliceGenerator._getAllLegendaryTiles(remainingTiles);
            while (
                chosenLegendaryTiles.length < options.minLegendary &&
                remainingLegendaryTiles.length > 0
            ) {
                const tile = remainingLegendaryTiles.pop();
                AbstractSliceGenerator._promote(
                    tile,
                    chosenTiles,
                    remainingTiles
                );
            }
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

        // Add remaining to result.
        chosenTiles.remainingTiles = remainingTiles;

        return chosenTiles;
    }
}

module.exports = { AbstractSliceGenerator, SLICE_SHAPES };
