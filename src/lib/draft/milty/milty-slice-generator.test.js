require("../../../global"); // create world.TI4
const assert = require("assert");
const lodash = require("lodash");
const { MiltySliceGenerator } = require("./milty-slice-generator");

// long-running test, disabled
// TODO XXX: break down into smaller tests
// it("generate", () => {
//     const sliceGenerator = new MiltySliceGenerator();
//     const slices = sliceGenerator.generate();
//     assert(sliceGenerator.getCount() > 0);
//     assert.equal(slices.length, sliceGenerator.getCount());
// });

it("fix adj anomalies", () => {
    const sliceGenerator = new MiltySliceGenerator();

    // 0 anomalies
    let generatedSlice = [19, 20, 21, 22, 23];
    let actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    let expected = generatedSlice;
    assert.deepEqual(actual, expected);

    // 1 anomaly
    generatedSlice = [19, 41, 21, 22, 23];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    expected = generatedSlice;
    assert.deepEqual(actual, expected);

    // 2 anomalies, deterministic swap
    generatedSlice = [19, 41, 21, 42, 23];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    expected = [19, 21, 41, 42, 23];
    assert.deepEqual(actual, expected);

    // 2 anomalies, non-deterministic swap
    generatedSlice = [19, 20, 21, 41, 42];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    const validResults = [
        [19, 20, 42, 41, 21],
        [41, 20, 21, 19, 42],
        [19, 20, 41, 21, 42],
    ];
    assert.ok(validResults.some((result) => lodash.isEqual(result, actual)));
});
