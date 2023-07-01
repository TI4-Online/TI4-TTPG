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
    milty_eq: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,0,-2>", // front-far
    ],

    milty_7p_seat3: [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<2,0,-2>", // front (pushed forward)
        "<1,0,-1>", // right (pushed forward)
        "<2,-1,-1>", // left-eq
        "<3,-1,-2>", // front-far (pushed forward)
    ],
};

class AbstractSliceGenerator {
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

    static _hasAdjacentAnomalies(shape, slice) {
        AbstractUtil.assertIsShape(shape);
        AbstractUtil.assertIsSlice(slice, shape);

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

    static _separateAnomalies(shape, slice) {
        assert(Array.isArray(shape));
        for (const hex of shape) {
            assert(Hex._hexFromString(hex)); // valid hex string?
        }
        assert(Array.isArray(slice));
        for (const tile of slice) {
            assert(typeof tile === "number");
            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);
        }
        assert(shape.length === slice.length + 1); // first is home system

        slice = [...slice]; // work with a copy

        // First, shuffle a few times and see if we get a good setup.
        // Give up after a reasonable number of tries.
        for (let i = 0; i < 20; i++) {
            if (!AbstractSliceGenerator._hasAdjacentAnomalies(shape, slice)) {
                return slice;
            }
            Shuffle.shuffle(slice);
        }

        // No luck.  Walk through slice permutations and use the first good one.
        // (This always fixes the same way, hence a few random stabs before this.)
        const inspector = (candidate) => {
            return !AbstractSliceGenerator._hasAdjacentAnomalies(
                shape,
                candidate
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
}

module.exports = { AbstractSliceGenerator, SLICE_SHAPES };
