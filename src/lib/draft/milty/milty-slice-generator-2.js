const { toNumber } = require("lodash");
const assert = require("../../../wrapper/assert-wrapper");
const SYSTEM_DATA = require("../../system/system.data");

/**
 * Create Milty slice sets.
 *
 * Apply strict-upgrades for constraint resolution rather than generic
 * backtracking.  Backtracking works, but can take thousands of iterations.
 */
class MiltySliceGenerator2 {
    static getSystemData() {
        const result = [];
        for (const entry of SYSTEM_DATA) {
            if (entry.home) {
                continue;
            }
            if (entry.hyperlane) {
                continue;
            }
            if (entry.offMap) {
                continue;
            }
            if (entry.tile <= 0) {
                continue; // hack, used for defining planets without a system
            }
            if (entry.tile === 81) {
                continue; // muaat supernova
            }

            // Have a usable system.
            const planets = entry.planets || [];
            const anomalies = entry.anomalies || [];
            const wormholes = entry.wormholes || [];

            const r = planets
                .map((x) => {
                    return x.resources || 0;
                })
                .reduce((a, b) => {
                    return a + b;
                }, 0);
            const i = planets
                .map((x) => {
                    return x.influence || 0;
                })
                .reduce((a, b) => {
                    return a + b;
                }, 0);

            const isLegendary = entry.legendary;
            const isWormhole = wormholes.length > 0;
            const isRed = planets.length === 0 || anomalies.length > 0;

            result.push({ r, i, isLegendary, isWormhole, isRed });
        }
    }
}

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
const anom = [41, 42, 43, 44, 45, 67, 68, 79, 80];
const high = [28, 29, 30, 32, 33, 35, 36, 38, 69, 70, 71, 75];
const meds = [26, 27, 31, 34, 37, 64, 65, 66, 72, 73, 74, 76];
const lows = [19, 20, 21, 22, 23, 24, 25, 59, 60, 61, 62, 63];
const reds = [
    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 67, 68, 77, 78, 79, 80,
];

let tiles = new Set();
Object.keys(resu).forEach((x) => tiles.add(toNumber(x)));
Object.keys(infu).forEach((x) => tiles.add(toNumber(x)));
Object.keys(reds).forEach((x) => tiles.add(toNumber(x)));

tiles = [...tiles].map((x) => toNumber(x));
tiles.sort((a, b) => a - b);
console.log(tiles);

const x = tiles.map((tile) => {
    let tier = -1;
    if (high.includes(tile)) {
        tier = 1;
    } else if (meds.includes(tile)) {
        tier = 2;
    } else if (lows.includes(tile)) {
        tier = 3;
    }

    let wormhole = false;
    if ([26, 39, 79].includes(tile)) {
        wormhole = "alpha";
    }
    if ([25, 40, 64].includes(tile)) {
        wormhole = "beta";
    }

    const isRed = reds.includes(tile);
    const isAnom = anom.includes(tile);
    const isLegednary = [65, 66].includes(tile);

    const result = {
        tile,
        ru: resu[tile] || 0,
        iu: infu[tile] || 0,
    };
    if (tier >= 0) {
        result.tier = tier;
    }
    if (wormhole) {
        result.wormhole = wormhole;
    }
    if (isRed) {
        result.red = true;
    }
    if (isAnom) {
        result.anom = true;
    }
    if (isLegednary) {
        result.legendary = true;
    }

    return result;
});
console.log(JSON.stringify(x, false, 4));
