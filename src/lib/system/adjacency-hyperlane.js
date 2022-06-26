const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../hex");
const { AdjacencyNeighbor } = require("./adjacency-neighbor");
const { Facing } = require("../facing");
const { GameObject, world } = require("../../wrapper/api");

let _hexToSystemObj = undefined;
let _hexToSystemObjLastUpdateTimestamp = 0;

/**
 * Get adjacent-via-hyperlane hexes.
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
     * Convert ttpg yaw rotation for a system tile to rotation to an index
     * that follows the Hex library convention.
     *
     * @returns {Array} Arrays containg HyperlaneConnection objects between
     * this._hex and it's adjacent hexes that contain hyperlane tiles.
     */
    _getAdjacentHyperlanes() {
        const adjacentHexes = new Set();
        const adjacentNeighbors = new AdjacencyNeighbor(this._hex);
        for (const adjacentHex of adjacentNeighbors.getAdjacent()) {
            adjacentHexes.add(adjacentHex);
        }

        // Cache hex to system tile object, periodically invalidate.
        const now = Date.now() / 1000;
        if (now - _hexToSystemObjLastUpdateTimestamp > 5) {
            _hexToSystemObj = undefined;
        }
        if (!_hexToSystemObj) {
            _hexToSystemObj = {};
            for (const systemObj of world.TI4.getAllSystemTileObjects()) {
                const pos = systemObj.getPosition();
                const hex = Hex.fromPosition(pos);
                _hexToSystemObj[hex] = systemObj; // pick one if stacked
            }
        }

        const adjacentHyperlanes = [];
        var hexSideIndex = 0;
        adjacentHexes.forEach((hex) => {
            const systemObj = _hexToSystemObj[hex];
            if (systemObj) {
                const system = world.TI4.getSystemBySystemTileObject(systemObj);
                if (system.raw.hyperlane) {
                    adjacentHyperlanes.push(
                        new HyperlaneConnection(this._hex, hex, hexSideIndex)
                    );
                }
            }
            hexSideIndex++;
        });

        return adjacentHyperlanes;
    }

    /**
     * Convert ttpg yaw rotation for a system tile to rotation to an
     * index that follows the Hex library convention.
     *
     * @param {GameObject} systemObj
     * @returns {number} Number of times the system tile has been rotated
     * 60 degrees (counter-clockwise in accordance with hex convention).
     */
    _getHyperlaneRotation(systemObj) {
        assert(systemObj instanceof GameObject);
        // Rotation in ttpg is clockwise, but the hex library convention is
        // counter clockwise so we need to flip the rotation.
        var yaw = -systemObj.getRotation().yaw % 360;
        if (yaw < 0) {
            yaw += 360;
        }
        // Rotations in a hex grid must be by 60 degrees.
        return Math.round(yaw / 60) % 6;
    }

    /**
     * Get the hyperlane paths on the target hex, originating from
     * the target side of the hex.
     *
     * @param {string} hex
     * @param {number} rotation
     * @param {number} hexSideIndex
     * @returns {Array} Array of hex indicies representing the sides
     * of the hyperlane tile connected (via hyperlanelane) to the
     * specified side of the hex.
     */
    _getHyperlaneConnections(hex, rotation, sourceHexSideIndex) {
        assert(typeof hex === "string");
        assert(typeof rotation === "number");
        assert(typeof sourceHexSideIndex === "number");

        // Convert sourceHexSideIndex to the side index for the new hex
        const hexSideIndex = (sourceHexSideIndex + 3) % 6;
        // Hyperlane tile information is stored in a set of arrays, hyperlane
        // alignment is used to determine which of those arrays should be used
        // based on the starting side and rotation of the hyperlane tile.
        var hyperlaneAlignment = hexSideIndex - rotation;
        if (hyperlaneAlignment < 0) {
            hyperlaneAlignment += 6;
        }

        const pos = Hex.toPosition(hex);
        const systemObj = world.TI4.getSystemTileObjectByPosition(pos);
        const system = world.TI4.getSystemBySystemTileObject(systemObj);
        var hyperlanes = [];
        if (Facing.isFaceUp(systemObj)) {
            if (
                system.raw.hyperlaneFaceUp &&
                system.raw.hyperlaneFaceUp[hyperlaneAlignment]
            ) {
                hyperlanes = [
                    ...system.raw.hyperlaneFaceUp[hyperlaneAlignment],
                ];
            }
        } else {
            if (
                system.raw.hyperlaneFaceDown &&
                system.raw.hyperlaneFaceDown[hyperlaneAlignment]
            ) {
                hyperlanes = [
                    ...system.raw.hyperlaneFaceDown[hyperlaneAlignment],
                ];
            }
        }

        // data in the hyperlane array assumes no rotation, so we
        // add the rotation value to each data point in the array here.
        hyperlanes.forEach((connection, index) => {
            hyperlanes[index] = (connection + rotation) % 6;
            if (hyperlanes[index] < 0) {
                hyperlanes[index] += 6;
            }
        });

        return hyperlanes;
    }

    /**
     * Get the hexes granted adjacency from hyperlanes by tracing hyperlane paths.
     *
     * @param {Array} untracedHyperlanes
     * @returns {Set.{string}} Set of hexes adjacent via hyperlane.
     */
    _getHexesAlongHyperlaneRoutes(untracedHyperlanes) {
        assert(Array.isArray(untracedHyperlanes));
        const adjacentHexSet = new Set();
        const hyperlaneRoutes = new Set();

        while (untracedHyperlanes.length != 0) {
            var hyperlanePath = untracedHyperlanes.shift();
            assert(hyperlanePath instanceof HyperlaneConnection);
            var hyperlaneHex = hyperlanePath.destinationHex;
            var sourceHex = hyperlanePath.sourceHex;
            var sourceHexIndex = hyperlanePath.adjacencyIndex;

            // Each 'routeString' is string composed of a unique hex and side pairing.
            // 'routestring's are used to keep track of which hyperlanes we have
            // already traveled down to prevent infinite loops.
            var routeString = sourceHex + " " + sourceHexIndex;
            if (!hyperlaneRoutes.has(routeString)) {
                hyperlaneRoutes.add(routeString);
                const pos = Hex.toPosition(hyperlaneHex);
                const systemObj = world.TI4.getSystemTileObjectByPosition(pos);
                const rotation = this._getHyperlaneRotation(systemObj);

                const hyperlanes = this._getHyperlaneConnections(
                    hyperlaneHex,
                    rotation,
                    sourceHexIndex
                );

                const adjacentNeighborsForHyperlaneTile = new AdjacencyNeighbor(
                    hyperlaneHex
                );
                var hexIndex = 0;
                for (const adjacentHex of adjacentNeighborsForHyperlaneTile.getAdjacent()) {
                    if (hyperlanes.includes(hexIndex)) {
                        const newPos = Hex.toPosition(adjacentHex);
                        const newSystemObj =
                            world.TI4.getSystemTileObjectByPosition(newPos);
                        if (newSystemObj) {
                            const newSystem =
                                world.TI4.getSystemBySystemTileObject(
                                    newSystemObj
                                );
                            if (newSystem.raw.hyperlane) {
                                untracedHyperlanes.push(
                                    new HyperlaneConnection(
                                        hyperlaneHex,
                                        adjacentHex,
                                        hexIndex
                                    )
                                );
                            } else {
                                adjacentHexSet.add(adjacentHex);
                            }
                        }
                    }
                    hexIndex++;
                }
            }
        }

        return adjacentHexSet;
    }

    /**
     * Get adjacent.
     *
     * @returns {Set.{string}} hex values
     */
    getAdjacent() {
        // Get adjacent hexes which have hyperlane tiles.
        const adjacentHyperlanes = this._getAdjacentHyperlanes();

        if (adjacentHyperlanes.length > 0) {
            return this._getHexesAlongHyperlaneRoutes(adjacentHyperlanes);
        } else {
            return new Set();
        }
    }
}

/**
 * Class that represets the edge to edge connection between two hexes.
 * Usually hexes which contain hyperlane tiles.
 */

class HyperlaneConnection {
    /**
     * Constructor.
     *
     * @param {string} hex
     * @param {string} destinationHex
     * @param {number} adjacencyIndex
     */
    constructor(sourceHex, destinationHex, adjacencyIndex) {
        assert(typeof sourceHex === "string");
        assert(typeof destinationHex === "string");
        assert(typeof adjacencyIndex === "number");
        this.sourceHex = sourceHex;
        this.destinationHex = destinationHex;
        this.adjacencyIndex = adjacencyIndex;
    }
}

module.exports = { AdjacencyHyperlane };
