require("../../../global");
const assert = require("assert");
const { AbstractUtil } = require("../abstract/abstract-util");
const { MiltySliceGenerator } = require("./milty-slice-generator");
const { world } = require("../../../wrapper/api");

it("constructor", () => {
    new MiltySliceGenerator();
});

it("generateSlices", () => {
    const count = world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const slices = sliceGenerator.generateSlices();
    AbstractUtil.assertIsSliceArray(slices, shape);
    assert.equal(slices.length, count);
});

it("verify unique", () => {
    const count = world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const TEST_ITERATIONS = 5;

    for (let i = 0; i < TEST_ITERATIONS; i++) {
        //console.log(`iteration ${i}`);

        const slices = sliceGenerator.generateSlices();
        AbstractUtil.assertIsSliceArray(slices, shape);

        const seen = new Set();
        for (const slice of slices) {
            for (const tile of slice) {
                assert(!seen.has(tile));
                seen.add(tile);
            }
        }
    }
});

/*
// This is VERY SLOW.  Results:
// - targeted inf/res 43.30/42.72 (107.28/105.85) msecs=1.41
// - miltydraft.com inf/res 44.30/41.14 (109.70/101.91) msecs=597.39
//
// tileToCount with 10K iterations:
// - targeted: {"19":7295,"20":8043,"21":5835,"22":5774,"23":8100,"24":8140,"25":8737,"26":8699,"27":4230,"28":7927,"29":7441,"30":6790,"31":3364,"32":7677,"33":7369,"34":7242,"35":7360,"36":7345,"37":4069,"38":2836,"59":8150,"60":4324,"61":4323,"62":4024,"63":7255,"64":8665,"65":8455,"66":8394,"69":6528,"70":7341,"71":4569,"72":5729,"73":6277,"74":7646,"75":6817,"76":7230}
// - miltydraft.com: {"19":7760,"20":6771,"21":5393,"22":5401,"23":6821,"24":8334,"25":9204,"26":8939,"27":7584,"28":5431,"29":6702,"30":4335,"31":7430,"32":3687,"33":4373,"34":9481,"35":5150,"36":4362,"37":9748,"38":1572,"59":8319,"60":4854,"61":4805,"62":4592,"63":7746,"64":8929,"65":8715,"66":9068,"69":6645,"70":4263,"71":2533,"72":8764,"73":9190,"74":9258,"75":4327,"76":9514}

it("report distributions", () => {
    const count = 8; //world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const TEST_ITERATIONS = 10000;

    const run = () => {
        const startMescs = Date.now();
        const inf = [];
        const res = [];
        const tileToCount = {};

        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const slices = sliceGenerator.generateSlices();
            AbstractUtil.assertIsSliceArray(slices, shape);

            for (const slice of slices) {
                const { optInf, optRes } = world.TI4.System.summarizeRaw(slice);
                //console.log(`${optInf}/${optRes}`);
                inf.push(optInf);
                res.push(optRes);

                for (const tile of slice) {
                    const system = world.TI4.getSystemByTileNumber(tile);
                    if (system.blue) {
                        tileToCount[tile] = (tileToCount[tile] || 0) + 1;
                    }
                }
            }
        }

        const n = TEST_ITERATIONS;

        const totalMsecs = Date.now() - startMescs;
        const msecsPerTest = totalMsecs / n;

        const infMean = inf.reduce((a, b) => a + b) / n;
        const infStdDev = Math.sqrt(
            inf.map((x) => Math.pow(x - infMean, 2)).reduce((a, b) => a + b) / n
        );

        const resMean = res.reduce((a, b) => a + b) / n;
        const resStdDev = Math.sqrt(
            res.map((x) => Math.pow(x - resMean, 2)).reduce((a, b) => a + b) / n
        );

        const isTargeted = sliceGenerator.getUseTargetedSliceGenerator();
        const fixed = 2;
        const msg = [
            isTargeted ? "targeted" : "miltydraft.com",
            "inf/res",
            `${infMean.toFixed(fixed)}/${resMean.toFixed(fixed)}`,
            `(${infStdDev.toFixed(fixed)}/${resStdDev.toFixed(fixed)})`,
            `msecs=${msecsPerTest.toFixed(fixed)}`,
        ].join(" ");
        console.log(msg);

        console.log(JSON.stringify(tileToCount));
    };

    sliceGenerator.setUseTargetedSliceGenerator(true);
    run();

    sliceGenerator.setUseTargetedSliceGenerator(false);
    run();
});
//*/
