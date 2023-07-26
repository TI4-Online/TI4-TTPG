const assert = require("../../../wrapper/assert-wrapper");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("../abstract/abstract-slice-generator");

class MiltySliceGenerator extends AbstractSliceGenerator {
    constructor() {
        super();
        this._useExtraWormholesAndLegendaries = true;
    }

    getUseExtraWormholesAndLegendaries() {
        return this._useExtraWormholesAndLegendaries;
    }

    setUseExtraWormholesAndLegendaries(value) {
        assert(typeof value === "boolean");
        this._useExtraWormholesAndLegendaries = value;
        return this;
    }

    getSliceShape() {
        return SLICE_SHAPES.milty;
    }

    generateSlices(sliceCount) {
        // TODO XXX
        // Get resu/infu values for systems.
    }
}

module.exports = { MiltySliceGenerator };
