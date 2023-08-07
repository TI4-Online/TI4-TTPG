const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");
const { SLICE_SHAPES } = require("../abstract/abstract-slice-generator");
const { world } = require("../../../wrapper/api");

class MiltyEqSliceLayout extends AbstractSliceLayout {
    constructor() {
        super();

        this.setShape(SLICE_SHAPES.milty_eq);

        if (world.TI4.config.playerCount === 7) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_eq_7p_seatIndex3);
        } else if (world.TI4.config.playerCount === 8) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_eq_7p_seatIndex3);
            this.setOverrideShape(7, SLICE_SHAPES.milty_eq_7p_seatIndex3);
        }
    }
}

module.exports = { MiltyEqSliceLayout };
