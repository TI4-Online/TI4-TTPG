const { SLICE_SHAPES } = require("../abstract/abstract-slice-generator");
const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");
const { world } = require("../../../wrapper/api");

class MiltySliceLayout extends AbstractSliceLayout {
    constructor() {
        super();

        this.setShape(SLICE_SHAPES.milty);

        if (world.TI4.config.playerCount === 7) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_7p_seatIndex3);
        } else if (world.TI4.config.playerCount === 8) {
            this.setOverrideShape(3, SLICE_SHAPES.milty_7p_seatIndex3);
            this.setOverrideShape(7, SLICE_SHAPES.milty_7p_seatIndex3);
        }
    }
}

module.exports = { MiltySliceLayout };
