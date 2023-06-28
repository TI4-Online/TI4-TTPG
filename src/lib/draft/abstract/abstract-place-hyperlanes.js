const MapStringParser = require("../../map-string/map-string-parser");
const { idxToHexString } = require("../../map-string/map-string-hex");
const { AbstractUtil } = require("./abstract-util");
const { Hex } = require("../../hex");

class AbstractPlaceHyperlanes {
    /**
     * Add hyperlanes and move any systems as necessary.
     *
     * @param {string} systemsMapString
     * @param {string} hyperlanesMapString
     * @returns {string} - mapString
     */
    placeHyperlanes(systemsMapString, hyperlanesMapString) {
        // Subclass can override, by default shift to closest empty spots.
        return AbstractPlaceHyperlanes._moveCollisions(
            systemsMapString,
            hyperlanesMapString
        );
    }

    /**
     * Helper function to shift systems with an overlaying hyperlane to the
     * closest open slot (could be in another ring!).
     *
     * @param {string} systemsMapString
     * @param {string} hyperlanesMapString
     * @returns {string} - mapString
     */
    static _moveCollisions(systemsMapString, hyperlanesMapString) {
        AbstractUtil.assertIsMapString(systemsMapString);
        AbstractUtil.assertIsMapString(hyperlanesMapString);

        const mapStringArray = MapStringParser.parse(systemsMapString);
        const hyperlaneArray = MapStringParser.parse(hyperlanesMapString);
        const maxIndex = Math.max(mapStringArray.length, hyperlaneArray.length);

        const open = new Set();
        const move = [];

        for (let index = 0; index < maxIndex; index++) {
            // Add hyperlane to map string.  If there is a tile there mark for move.
            const hyperlaneEntry = hyperlaneArray[index];
            if (hyperlaneEntry && hyperlaneEntry.tile > 0) {
                const mapStringEntry = mapStringArray[index];
                if (mapStringEntry && mapStringEntry.tile >= 0) {
                    move.push({ index, entry: mapStringEntry });
                }
                mapStringArray[index] = hyperlaneEntry;
            }

            // Keep track of open slots in the ring.
            const mapStringEntry = mapStringArray[index];
            if (
                (!hyperlaneEntry || hyperlaneEntry.tile <= 0) &&
                (!mapStringEntry || mapStringEntry.tile <= 0)
            ) {
                open.add(index);
            }
        }

        // Keep shifting move entries to open spots until all are done.
        // Prioritize moving the shortest distance each pass.
        while (move.length > 0) {
            let bestMoveIndex = undefined; // into the moveItem array, not map string
            let bestOpenIndex = undefined;
            let bestDistance = undefined;
            for (let moveIndex = 0; moveIndex < move.length; moveIndex++) {
                const moveItem = move[moveIndex];
                const moveHex = idxToHexString(moveItem.index); // this is map string index
                const movePos = Hex.toPosition(moveHex);
                for (const openIndex of open) {
                    const openHex = idxToHexString(openIndex);
                    const openPos = Hex.toPosition(openHex);
                    const distance = movePos
                        .subtract(openPos)
                        .magnitudeSquared();
                    if (!bestDistance || distance < bestDistance) {
                        bestMoveIndex = moveIndex;
                        bestOpenIndex = openIndex;
                        bestDistance = distance;
                    }
                }
                if (!bestDistance) {
                    throw new Error(`no open slot`);
                }
                mapStringArray[bestOpenIndex] = moveItem.entry;
                move.splice(bestMoveIndex, 1);
                open.delete(bestOpenIndex);
            }
        }

        const mapString = MapStringParser.format(mapStringArray);
        return mapString;
    }
}

module.exports = { AbstractPlaceHyperlanes };
