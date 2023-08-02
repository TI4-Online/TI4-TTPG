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

it("report distributions", () => {
    const count = world.TI4.config.playerCount + 2;
    const sliceGenerator = new MiltySliceGenerator().setCount(count);
    const shape = sliceGenerator.getSliceShape();

    const TEST_ITERATIONS = 1000;

    const run = () => {
        const startMescs = Date.now();
        const inf = [];
        const res = [];

        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const slices = sliceGenerator.generateSlices();
            AbstractUtil.assertIsSliceArray(slices, shape);

            for (const slice of slices) {
                const { optInf, optRes } = world.TI4.System.summarizeRaw(slice);
                //console.log(`${optInf}/${optRes}`);
                inf.push(optInf);
                res.push(optRes);
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
    };

    sliceGenerator.setUseTargetedSliceGenerator(true);
    run();

    sliceGenerator.setUseTargetedSliceGenerator(false);
    run();
});
*/
