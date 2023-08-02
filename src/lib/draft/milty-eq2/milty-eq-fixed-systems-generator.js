const assert = require("../../../wrapper/assert-wrapper");
const {
    AbstractFixedSystemsGenerator,
} = require("../abstract/abstract-fixed-systems-generator");
const {
    SLICE_SHAPES,
    AbstractSliceGenerator,
} = require("../abstract/abstract-slice-generator");
const { world } = require("../../../wrapper/api");
const {
    SetupGenericHomeSystems,
} = require("../../../setup/setup-generic-home-systems");
const { Hex } = require("../../hex");
const { AbstractSliceLayout } = require("../abstract/abstract-slice-layout");

//const { HIGH, MED, LOW, RED } = world.TI4.SYSTEM_TIER;
const HIGH = "high";
const MED = "med";
const LOW = "low";
const RED = "red";

const EQS_CHOICES = [
    { weight: 1, value: HIGH },
    { weight: 1, value: MED },
    { weight: 1, value: LOW },
    { weight: 2, value: RED },
];

const MIN_WORMHOLE_CHOICES = [
    { weight: 1, value: 0 },
    { weight: 1, value: 1 },
];

class MiltyEqFixedSystemsGenerator extends AbstractFixedSystemsGenerator {
    getFixedHexes() {
        const fixedHexes = [];
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const offMap = false;
            const pos = SetupGenericHomeSystems.getHomeSystemPosition(
                playerDesk,
                offMap
            );
            const anchorHex = Hex.fromPosition(pos);
            let dirHex = "<0,0,0>";
            let shapeHex = SLICE_SHAPES.milty_eq_fixed[0];

            const playerCount = world.TI4.config.playerCount;
            if (playerCount === 7 && playerDesk.index === 5) {
                shapeHex = "<3,-1,-2>";
            }
            if (playerCount === 8 && playerDesk.index === 3) {
                dirHex = "<1,0,-1>";
                shapeHex = "<2,0,-2>";
            }
            if (playerCount === 8 && playerDesk.index === 7) {
                dirHex = "<-1,0,1>";
                shapeHex = "<2,0,-2>";
            }

            const fixedHex = AbstractSliceLayout._defaultLayoutTile(
                anchorHex,
                dirHex,
                shapeHex
            );
            fixedHexes.push(fixedHex);
        }

        if (!world.__isMock) {
            console.log(
                `MiltyEqFixedSystemsGenerator.getFixedHexes: ${JSON.stringify(
                    fixedHexes
                )}`
            );
        }

        return fixedHexes;
    }

    generateFixedSystems(fixedCount, sliceGeneratorSlices) {
        assert(typeof fixedCount === "number");
        assert(Array.isArray(sliceGeneratorSlices));

        // Treat each EQ as a one-tile slice.
        const tieredSlices = [];
        for (let i = 0; i < fixedCount; i++) {
            const tier = AbstractSliceGenerator._weightedChoice(EQS_CHOICES); // makes a copy
            tieredSlices.push([tier]);
        }

        const options = {
            minWormholes:
                AbstractSliceGenerator._weightedChoice(MIN_WORMHOLE_CHOICES),
            minLegendary: 0,
        };
        const { chosenTiles, remainingTiles } =
            AbstractSliceGenerator._getRandomTieredSystemsWithLegendaryWormholePromotion(
                options
            );

        // Strip out any tiles used by slices.
        const used = new Set();
        for (const slice of sliceGeneratorSlices) {
            for (const tile of slice) {
                used.add(tile);
            }
        }
        const pruneUsed = (tiles) => {
            return tiles.filter((tile) => {
                return !used.has(tile);
            });
        };
        chosenTiles.high = pruneUsed(chosenTiles.high);
        chosenTiles.med = pruneUsed(chosenTiles.med);
        chosenTiles.low = pruneUsed(chosenTiles.low);
        chosenTiles.red = pruneUsed(chosenTiles.red);
        remainingTiles.high = pruneUsed(remainingTiles.high);
        remainingTiles.med = pruneUsed(remainingTiles.med);
        remainingTiles.low = pruneUsed(remainingTiles.low);
        remainingTiles.red = pruneUsed(remainingTiles.red);

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

        const fixedTiles = [];
        for (const slice of slices) {
            assert(slice.length === 1);
            fixedTiles.push(slice[0]);
        }

        if (!world.__isMock) {
            console.log(
                `MiltyEqFixedSystemGenerator.generateFixedSystems: ${JSON.stringify(
                    fixedTiles
                )}`
            );
        }

        return fixedTiles;
    }
}

module.exports = { MiltyEqFixedSystemsGenerator };
