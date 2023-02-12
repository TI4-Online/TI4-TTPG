const assert = require("../../wrapper/assert-wrapper");
const { AdjacencyHyperlane } = require("./adjacency-hyperlane");
const { AdjacencyNeighbor } = require("./adjacency-neighbor");
const { AdjacencyWormhole } = require("./adjacency-wormhole");

class Adjacency {
    /**
     * Get adjacent.
     *
     * @returns {Array.{string}} hex values
     */
    static getAdjacent(hex, playerSlot = -1) {
        assert(typeof hex === "string");
        assert(typeof playerSlot === "number");

        const result = new Set();
        let adjHexes = undefined;

        adjHexes = new AdjacencyHyperlane(hex).getAdjacent();
        for (const adjHex of adjHexes) {
            result.add(adjHex);
        }

        adjHexes = new AdjacencyNeighbor(hex).getAdjacent();
        for (const adjHex of adjHexes) {
            result.add(adjHex);
        }

        adjHexes = new AdjacencyWormhole(hex, playerSlot).getAdjacent();
        for (const adjHex of adjHexes) {
            result.add(adjHex);
        }

        // Do not consider self adjacent.
        result.delete(hex);

        return [...result];
    }
}

module.exports = { Adjacency };
