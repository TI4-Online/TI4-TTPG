require("../../../global");
const assert = require("assert");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { MockPlayer } = require("../../../wrapper/api");

class MySliceGenerator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty;
    }

    generateSlices(count) {
        const numTiles = this.getSliceShape().length - 1;
        const slices = [];
        for (let i = 0; i < count; i++) {
            const slice = new Array(numTiles).fill(i + 1);
            slices.push(slice);
        }
        return slices;
    }
}

it("start", () => {
    const player = new MockPlayer();
    const sliceGenerator = new MySliceGenerator();

    const sliceDraft = new AbstractSliceDraft().setSliceGenerator(
        sliceGenerator
    );
    sliceDraft.start(player);
    sliceDraft.cancel(player);
});
