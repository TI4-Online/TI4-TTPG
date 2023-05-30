const { world } = require("../../../wrapper/api");

class AbstractSliceGenerator {
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
}

module.exports = { AbstractSliceGenerator };
