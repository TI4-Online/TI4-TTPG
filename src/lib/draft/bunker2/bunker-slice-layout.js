const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");
const { SLICE_SHAPES } = require("../abstract/abstract-slice-generator");
const { world } = require("../../../wrapper/api");

class BunkerSliceLayout extends AbstractSliceLayout {
    constructor() {
        super();

        this.setShape(SLICE_SHAPES.bunker);

        if (world.TI4.config.playerCount === 7) {
            this.setOverrideShape(1, [
                "<0,1,-1>", // right of anchor (home)
                "<0,0,0>", // anchor
                "<1,0,-1>", // front
                "<2,1,-3>", // shifted around hyperlane
                "<1,2,-3>", // shifted around hyperlane
            ]);
            this.setOverrideShape(3, [
                "<1,0,-1>", // front (home)
                "<0,0,0>", // anchor
                "<2,0,-2>", //
                "<1,1,-2>", //
                "<0,2,-2>", //
            ]);
            this.setOverrideShape(4, [
                "<0,1,-1>", // right of anchor (home)
                "<0,0,0>", // anchor
                "<1,0,-1>", // front
                "<1,1,-2>", // right-eq
                "<-1,2,-1>", // shifted around hyperlane
            ]);

            this.setOverrideShape(6, [
                "<0,1,-1>", // right of anchor (home)
                "<0,0,0>", // anchor
                "<1,0,-1>", // front
                "<1,1,-2>", // right-eq
                "<-1,3,-2>", // shifted around hyperlane
            ]);
        } else if (world.TI4.config.playerCount === 8) {
            //this.setOverrideShape(3, SLICE_SHAPES.milty_eq_7p_seatIndex3);
            //this.setOverrideShape(7, SLICE_SHAPES.milty_eq_7p_seatIndex3);
        }
    }
}

module.exports = { BunkerSliceLayout };
