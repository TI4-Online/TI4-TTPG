const assert = require("../../wrapper/assert-wrapper");

/**
 * Get adjacent-via-hyperlane hexes.
 *
 * @param {string} hex
 * @returns {Set.{string}} hex values
 */

class AdjacencyHyperlane {
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
        const adjacentHexSet = new Set();

        // TODO XXX

        return adjacentHexSet;
    }
}

module.exports = { AdjacencyHyperlane };
