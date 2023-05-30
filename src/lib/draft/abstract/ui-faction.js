const assert = require("../../../wrapper/assert-wrapper");
const { world } = require("../../../wrapper/api");

class UiFaction {
    constructor(factionNsidName, scale = 1) {
        assert(typeof factionNsidName === "string");
        assert(typeof scale === "number");

        const faction = world.TI4.getFactionByNsidName(factionNsidName);
        if (!faction) {
            throw new Error(`unknown faction "${factionNsidName}`);
        }

        // Just keep the name, look it up again when needed (do not cache here).
        this._factionNsidName = factionNsidName;
        this._scale = scale;
    }

    /**
     * Get the UI size.
     *
     * @returns {Object.{w:number,h:number}}
     */
    getSize() {
        return {
            w: 100 * this._scale,
            h: 100 * this._scale,
        };
    }

    draw() {}
}

module.exports = { UiFaction };
