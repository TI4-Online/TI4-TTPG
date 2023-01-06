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

        const avail = {
            high: [28, 29, 30, 32, 33, 35, 36, 38, 69, 70, 71, 75],
            meds: [26, 27, 31, 34, 37, 64, 65, 66, 72, 73, 74, 76],
            lows: [19, 20, 21, 22, 23, 24, 25, 59, 60, 61, 62, 63],
            reds: [
                39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 67, 68, 77, 78,
                79, 80,
            ],
        };
        let high = [];
        let meds = [];
        let lows = [];
        let reds = [];

        // Get to minalpha.
        let fixes = Shuffle.shuffle([
            () => {
                if (!meds.includes(26)) {
                    meds.push(26);
                    avail.meds = avail.meds.filter((x) => x != 26);
                }
            },
            () => {
                if (!reds.includes(39)) {
                    reds.push(39);
                    avail.reds = avail.reds.filter((x) => x != 39);
                }
            },
            () => {
                if (!reds.includes(79)) {
                    reds.push(79);
                    avail.reds = avail.reds.filter((x) => x != 79);
                }
            },
        ]);
        while (
            meds.includes(26) + reds.includes(39) + reds.includes(79) <
            minalpha
        ) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        // Get to minbeda.
        fixes = Shuffle.shuffle([
            () => {
                if (!lows.includes(25)) {
                    lows.push(25);
                    avail.lows = avail.lows.filter((x) => x != 25);
                }
            },
            () => {
                if (!reds.includes(40)) {
                    reds.push(40);
                    avail.reds = avail.reds.filter((x) => x != 40);
                }
            },
            () => {
                if (!meds.includes(64)) {
                    meds.push(64);
                    avail.meds = avail.meds.filter((x) => x != 64);
                }
            },
        ]);
        while (
            lows.includes(25) + reds.includes(40) + meds.includes(64) <
            minbeta
        ) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        // Get to minlegend.
        fixes = Shuffle.shuffle([
            () => {
                if (!meds.includes(65)) {
                    meds.push(65);
                    avail.meds = avail.meds.filter((x) => x != 65);
                }
            },
            () => {
                if (!meds.includes(66)) {
                    meds.push(66);
                    avail.meds = avail.meds.filter((x) => x != 66);
                }
            },
        ]);
        while (meds.includes(65) + meds.includes(66) < minlegend) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        if (high.length > numslice) {
            continue;
        }
        if (meds.length > numslice) {
            continue;
        }
        if (lows.length > numslice) {
            continue;
        }
        if (reds.length > numslice * 2) {
            continue;
        }

        // Scramble remaining.
        avail.high = Shuffle.shuffle(avail.high);
        avail.meds = Shuffle.shuffle(avail.meds);
        avail.lows = Shuffle.shuffle(avail.lows);
        avail.reds = Shuffle.shuffle(avail.reds);

        // Grow slices.
        while (high.length < numslice) {
            high.push(avail.high.shift());
        }
        while (meds.length < numslice) {
            meds.push(avail.meds.shift());
        }
        while (lows.length < numslice) {
            lows.push(avail.lows.shift());
        }
        while (reds.length < numslice * 2) {
            reds.push(avail.reds.shift());
        }

        // Scramble chosen.
        high = Shuffle.shuffle(high);
        meds = Shuffle.shuffle(meds);
        lows = Shuffle.shuffle(lows);
        reds = Shuffle.shuffle(reds);

        const chooseOne = (s, choices) => {
            // Only one alpha wormhole.
            if (s.includes(26) + s.includes(39) + s.includes(79) >= 1) {
                choices = choices.filter(
                    (x) => x !== 26 && x !== 39 && x !== 79
                );
            }
            // Only one beta wormhole.
            if (s.includes(25) + s.includes(40) + s.includes(64) >= 1) {
                choices = choices.filter(
                    (x) => x !== 25 && x !== 40 && x !== 64
                );
            }
            // Only one legednary.
            if (s.includes(65) + s.includes(66) >= 1) {
                choices = choices.filter((x) => x !== 65 && x !== 66);
            }
            return choices[Math.floor(Math.random() * choices.length)];
        };
        const addHigh = (s) => {
            const choice = chooseOne(s, high);
            high = high.filter((x) => x !== choice);
            s.push(choice);
        };
        const addMed = (s) => {
            const choice = chooseOne(s, meds);
            meds = meds.filter((x) => x !== choice);
            s.push(choice);
        };
        const addLow = (s) => {
            const choice = chooseOne(s, lows);
            lows = lows.filter((x) => x !== choice);
            s.push(choice);
        };
        const addRed = (s) => {
            const choice = chooseOne(s, reds);
            reds = reds.filter((x) => x !== choice);
            s.push(choice);
        };

        let good = true;
        for (let i = 0; i < numslice; i++) {
            let s = [];
            const additions = Shuffle.shuffle([
                () => {
                    addHigh(s);
                },
                () => {
                    addMed(s);
                },
                () => {
                    addLow(s);
                },
                () => {
                    addRed(s);
                },
                () => {
                    addRed(s);
                },
            ]);
            additions.forEach((f) => f());

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

            // Keep shuffling tiles in slice until no adjacent anomalies.
            s = MiltySliceGenerator.fixAdjAnomalies(s);

            slices.push(s);
        }
        if (good) {
            console.log(`loops: ${loops}`);
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

    // if there are 2 anomalies, choose one randomly and swap it with one of the remaining valid spaces
    static fixAdjAnomalies(s) {
        const anom = [41, 42, 43, 44, 45, 67, 68, 79, 80];
        const validAnomPairs = {
            0: [2, 4],
            1: [],
            2: [0, 3, 4],
            3: [2],
            4: [0, 2],
        };

        let anomPositions = [];
        for (let i = 0; i < anom.length; i++) {
            let j = s.indexOf(anom[i]);
            if (j >= 0) {
                anomPositions.push(j);
            }
        }
        if (anomPositions.length < 2) {
            return s;
        }

        let anomToSwap, anomToKeep;
        if (anomPositions.includes(1)) {
            // 1 is adjacent to all tiles, must always be swapped
            anomToSwap = 1;
            anomToKeep =
                anomPositions.indexOf(1) == 0
                    ? anomPositions[1]
                    : anomPositions[0];
        } else {
            let shuffledAnom = Shuffle.shuffle(anomPositions);
            anomToSwap = shuffledAnom[0];
            anomToKeep = shuffledAnom[1];
        }
        let swapDest = Shuffle.drawRandom(validAnomPairs[anomToKeep]);

        [s[anomToSwap], s[swapDest]] = [s[swapDest], s[anomToSwap]];
        return s;
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
        const isGood = (slices) => {
            if (!slices) {
                return false;
            }
            if (slices.length != this._count) {
                return false;
            }
            for (const slice of slices) {
                if (slice.length !== 5) {
                    return false;
                }
                for (const tile of slice) {
                    if (typeof tile !== "number") {
                        return false;
                    }
                }
            }
            return true;
        };

        let result = false;
        while (!result) {
            result = miltyslices(
                this._count,
                this._extraLegendariesAndWormholes,
                this._minInf,
                this._minRes,
                this._minTot,
                this._maxTot
            );
            // It fails sometimes, yuck.
            if (!isGood(result)) {
                console.log("MiltySliceGenerator.generate: err, trying again");
                result = false;
            }
        }
        return result;
    }
}

module.exports = { MiltySliceGenerator };
