const assert = require("../../../wrapper/assert-wrapper");
const { Shuffle } = require("../../../lib/shuffle");
const { world } = require("../../../wrapper/api");

// From MiltyDraft.com
// @author BradleySigma

// TODO XXX: REPLACE "reject and regenerate" with tile swaps to fix bad neighbors.
// This can fail after 10K runs due to RNG!!

const resu = {
    19: 0,
    20: 1,
    21: 0.5,
    22: 0.5,
    23: 1,
    24: 0,
    25: 2,
    26: 3,
    27: 3.5,
    28: 2,
    29: 0,
    30: 3,
    31: 3,
    32: 0.5,
    33: 2,
    34: 0.5,
    35: 3,
    36: 2,
    37: 0,
    38: 5,
    59: 0,
    60: 2,
    61: 2,
    62: 3,
    63: 0,
    64: 3,
    65: 2,
    66: 3,
    67: 2,
    68: 3,
    69: 0,
    70: 2,
    71: 3.5,
    72: 3,
    73: 0,
    74: 2,
    75: 3,
    76: 0.5,
};
const infu = {
    19: 2,
    20: 1,
    21: 0.5,
    22: 0.5,
    23: 1,
    24: 3,
    25: 0,
    26: 0,
    27: 0.5,
    28: 3,
    29: 5,
    30: 2,
    31: 0,
    32: 2.5,
    33: 2,
    34: 3.5,
    35: 3,
    36: 2,
    37: 6,
    38: 0,
    59: 3,
    60: 0,
    61: 0,
    62: 0,
    63: 2,
    64: 0,
    65: 0,
    66: 0,
    67: 0,
    68: 0,
    69: 6,
    70: 2,
    71: 0.5,
    72: 1,
    73: 3,
    74: 2,
    75: 2,
    76: 3.5,
};

function miltyslices(
    numslice,
    extralegwh = true,
    mininf = 4.0,
    minres = 2.5,
    mintot = 9.0,
    maxtot = 13.0
) {
    let minalpha, minbeta, minlegend;
    if (extralegwh) {
        minalpha = Math.random() < 0.5 ? 2 : 3;
        minbeta = Math.random() < 0.5 ? 2 : 3;
        minlegend = Math.random() < 0.5 ? 1 : 2;
    } else {
        minalpha = 0;
        minbeta = 0;
        minlegend = 0;
    }

    let loops = 0;
    let slices;
    while (loops < 1000000) {
        loops += 1;
        slices = [];

        const high = Shuffle.shuffle([
            28, 29, 30, 32, 33, 35, 36, 38, 69, 70, 71, 75,
        ]).slice(-numslice);
        const meds = Shuffle.shuffle([
            26, 27, 31, 34, 37, 64, 65, 66, 72, 73, 74, 76,
        ]).slice(-numslice);
        const lows = Shuffle.shuffle([
            19, 20, 21, 22, 23, 24, 25, 59, 60, 61, 62, 63,
        ]).slice(-numslice);
        const reds = Shuffle.shuffle([
            39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 67, 68, 77, 78, 79,
            80,
        ]).slice(-2 * numslice);

        if (
            meds.includes(26) + reds.includes(39) + reds.includes(79) <
            minalpha
        ) {
            continue;
        }
        if (
            lows.includes(25) + reds.includes(40) + meds.includes(64) <
            minbeta
        ) {
            continue;
        }
        if (meds.includes(65) + meds.includes(66) < minlegend) {
            continue;
        }

        let good = true;
        for (let i = 0; i < numslice; i++) {
            let s = [high[i], meds[i], lows[i], reds[2 * i], reds[2 * i + 1]];
            let sres = 0;
            let sinf = 0;
            for (let j = 0; j < s.length; j++) {
                let n = s[j];
                sres += n in resu ? resu[n] : 0;
                sinf += n in infu ? infu[n] : 0;
            }
            if (
                sres < minres ||
                sinf < mininf ||
                sres + sinf < mintot ||
                sres + sinf > maxtot
            ) {
                good = false;
                break;
            }
            if (s.includes(26) + s.includes(39) + s.includes(79) > 1) {
                good = false;
                break;
            }
            if (s.includes(25) + s.includes(40) + s.includes(64) > 1) {
                good = false;
                break;
            }
            if (s.includes(65) + s.includes(66) > 1) {
                good = false;
                break;
            }

            s = Shuffle.shuffle(s);
            const neigh = [
                [0, 1],
                [0, 3],
                [1, 2],
                [1, 3],
                [1, 4],
                [3, 4],
            ];
            const anom = [41, 42, 43, 44, 45, 67, 68, 79, 80];
            for (let j = 0; j < neigh.length; j++) {
                if (
                    anom.includes(s[neigh[j][0]]) &&
                    anom.includes(s[neigh[j][1]])
                ) {
                    good = false;
                    break;
                }
            }
            if (!good) {
                break;
            }

            slices.push(s);
        }
        if (good) {
            return slices;
        }
    }
}

// Wrap in a static class like other modules.
class MiltySliceGenerator {
    static get maxCount() {
        return 9;
    }

    static get minCount() {
        return world.TI4.config.playerCount;
    }

    static get defaultCount() {
        let value = world.TI4.config.playerCount + 1;
        value = Math.max(value, MiltySliceGenerator.minCount);
        value = Math.min(value, MiltySliceGenerator.maxCount);
        return value;
    }

    constructor() {
        this.reset();
    }

    reset() {
        this._count = MiltySliceGenerator.defaultCount;
        this._extraLegendariesAndWormholes = true;
        this._minInf = 4;
        this._minRes = 2.5;
        this._minTot = 9;
        this._maxTot = 13;
    }

    getExtraLegendariesAndWormholes(value) {
        assert(typeof value === "boolean");
        this._extraLegendariesAndWormholes = value;
        return this;
    }

    getCount() {
        return this._count;
    }

    setExtraLegendariesAndWormholes(value) {
        assert(typeof value === "boolean");
        this._extraLegendariesAndWormholes = value;
        return this;
    }

    setCount(value) {
        assert(typeof value === "number");
        assert(value >= MiltySliceGenerator.minCount);
        assert(value <= MiltySliceGenerator.maxCount);
        this._count = value;
        return this;
    }

    generate() {
        return miltyslices(
            this._count,
            this._extraLegendariesAndWormholes,
            this._minInf,
            this._minRes,
            this._minTot,
            this._maxTot
        );
    }
}

module.exports = { MiltySliceGenerator };
