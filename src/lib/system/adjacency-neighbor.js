const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../hex");

/**
 * Get adjacent-via-neighboring hexes.
 */
class AdjacencyNeighbor {
    /**
     * Constructor.
     *
     * @param {string} hex
     */
    constructor(hex) {
        assert(typeof hex === "string");
        this._hex = hex;
    }

    /**
     * Get adjacent.
     *
     * @returns {Set.{string}} hex values
     */
    getAdjacent() {
        return new Set(Hex.neighbors(this._hex));
    }
}

module.exports = { AdjacencyNeighbor };
