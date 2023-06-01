const assert = require("../../../wrapper/assert-wrapper");
const MapStringParser = require("../../map-string/map-string-parser");
const { idxToHexString } = require("../../map-string/map-string-hex");
const { Hex } = require("../../hex");

class AbstractPlaceHyperlanes {
    /**
     * Add hyperlanes and move any systems as necessary.
     *
     * @param {string} mapString
     * @returns {string} - mapString
     */
    placeHyperlanes(mapString) {
        throw new Error("subclass must override this");
    }

    /**
     * Helper function to shift systems with an overlaying hyperlane to the
     * closest open slot in the same map ring.
     *
     * @param {string} systemsMapString
     * @param {string} hyperlanesMapString
     * @returns {string} - mapString
     */
    static _moveCollisions(systemsMapString, hyperlanesMapString) {
        assert(typeof systemsMapString === "string");
        assert(typeof hyperlanesMapString === "string");

        const mapStringArray = MapStringParser.parse(systemsMapString);
        const hyperlaneArray = MapStringParser.parse(hyperlanesMapString);

        // Entry zero is Mecatol Rex spot.
        const rings = [
            { first: 1, last: 6 },
            { first: 7, last: 18 },
            { first: 19, last: 36 },
        ];
        for (const ring of rings) {
            const open = new Set();
            const move = [];
            hyperlaneArray.forEach((entry, index) => {
                // Only consider entries in the current ring.
                if (index < ring.first || index > ring.last) {
                    return;
                }

                // Add hyperlane to map string.  If there is a tile there mark for move.
                let mapStringEntry = mapStringArray[index];
                if (entry.tile > 0) {
                    if (mapStringEntry && mapStringEntry.tile >= 0) {
                        move.push({ index, entry: mapStringEntry });
                    }
                    mapStringArray[index] = entry;
                }

                // Keep track of open slots in the ring.
                mapStringEntry = mapStringArray[index];
                if (
                    entry.tile <= 0 &&
                    (!mapStringEntry || mapStringEntry.tile <= 0)
                ) {
                    open.add(index);
                }
            });

            // Rather than hard-coding shifts, move to closest slot in same ring.
            for (const moveItem of move) {
                // Getting the distance between map string index values gets
                // tricky when they are on different sides of the start/end gap.
                // Use simple distance instead of clever math.
                const hex0 = idxToHexString(moveItem.index);
                const pos0 = Hex.toPosition(hex0);

                let bestIndex = undefined;
                let bestDistance = undefined;
                let nextIndex = moveItem.index + 1;
                for (let i = ring.first; i < ring.last; i++) {
                    if (nextIndex === ring.last + 1) {
                        nextIndex = ring.first;
                    }
                    if (open.has(nextIndex)) {
                        const hex1 = idxToHexString(nextIndex);
                        const pos1 = Hex.toPosition(hex1);
                        const distance = pos0.subtract(pos1).magnitudeSquared();
                        if (!bestDistance || distance < bestDistance) {
                            bestIndex = nextIndex;
                            bestDistance = distance;
                        }
                    }
                    nextIndex += 1;
                }
                if (!bestIndex) {
                    throw new Error(
                        `no open slot in ring ${JSON.stringify(ring)}`
                    );
                }
                mapStringArray[bestIndex] = moveItem.entry;
                open.delete(bestIndex);
            }
        }

        const mapString = MapStringParser.format(mapStringArray);
        return mapString;
    }
}

module.exports = { AbstractPlaceHyperlanes };
