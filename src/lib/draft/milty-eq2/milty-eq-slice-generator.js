const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("../abstract/abstract-slice-generator");
const { world } = require("../../../wrapper/api");

//const { HIGH, MED, LOW, RED } = world.TI4.SYSTEM_TIER;
const HIGH = "high";
const MED = "med";
const LOW = "low";
const RED = "red";

const SLICE_CHOICES = [
    // 2 red
    { weight: 2, value: [RED, RED, HIGH, HIGH] }, // 6
    { weight: 3, value: [RED, RED, HIGH, MED] }, // 5
    { weight: 1, value: [RED, RED, MED, MED] }, // 4

    // 1 red
    { weight: 2, value: [RED, HIGH, MED, LOW] }, // 6
    { weight: 3, value: [RED, HIGH, LOW, LOW] }, // 5
    { weight: 2, value: [RED, MED, MED, LOW] }, // 5
    { weight: 1, value: [RED, MED, LOW, LOW] }, // 4
];

const MIN_WORMHOLE_CHOICES = [
    { weight: 1, value: 2 },
    { weight: 1, value: 3 },
];

const MIN_LEGENDARY_CHOICES = [
    { weight: 1, value: 1 },
    { weight: 1, value: 2 },
];

class MiltyEqSliceGenerator extends AbstractSliceGenerator {
    getSliceShape() {
        return SLICE_SHAPES.milty_eq;
    }

    generateSlices(sliceCount) {
        const tieredSlices = [];
        for (let i = 0; i < sliceCount; i++) {
            const tierValues =
                AbstractSliceGenerator._weightedChoice(SLICE_CHOICES); // makes a copy
            tieredSlices.push(tierValues);
        }

        // How many of each tier?
        const options = {
            minAlphaWormholes:
                AbstractSliceGenerator._weightedChoice(MIN_WORMHOLE_CHOICES),
            minBetaWormholes:
                AbstractSliceGenerator._weightedChoice(MIN_WORMHOLE_CHOICES),
            minLegendary: AbstractSliceGenerator._weightedChoice(
                MIN_LEGENDARY_CHOICES
            ),
        };
        const { chosenTiles, remainingTiles } =
            AbstractSliceGenerator._getRandomTieredSystemsWithLegendaryWormholePromotion(
                options
            );

        const slices = [];
        AbstractSliceGenerator._fillSlicesWithRequiredTiles(
            tieredSlices,
            chosenTiles,
            slices
        );

        AbstractSliceGenerator._fillSlicesWithRemainingTiles(
            tieredSlices,
            remainingTiles,
            slices
        );

        for (let sliceIndex = 0; sliceIndex < slices.length; sliceIndex++) {
            let slice = slices[sliceIndex];
            const shape = this.getSliceShape();
            slice = AbstractSliceGenerator._separateAnomalies(slice, shape);
            slices[sliceIndex] = slice;
        }

        if (!world.__isMock) {
            console.log(
                `MiltyEqSliceGenerator.generateSlices: ${JSON.stringify(
                    slices
                )}`
            );
        }

        return slices;
    }
}

module.exports = { MiltyEqSliceGenerator };
