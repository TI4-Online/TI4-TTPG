const assert = require("../../../wrapper/assert-wrapper");

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

        // XXX TODO

        const mapString = "";

        return mapString;
    }
}

module.exports = { AbstractPlaceHyperlanes };
