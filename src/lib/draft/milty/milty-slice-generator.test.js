require("../../../global"); // create world.TI4
const assert = require("assert");
const lodash = require("lodash");
const { MiltySliceGenerator } = require("./milty-slice-generator");

it("generate", () => {
    const sliceGenerator = new MiltySliceGenerator();
    const slices = sliceGenerator.generate();
    assert(sliceGenerator.getCount() > 0);
    assert.equal(slices.length, sliceGenerator.getCount());
});

it("fix adj anomalies", () => {
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

    // 2 anomalies in 0,2 positions (valid)
    generatedSlice = [41, 20, 42, 22, 23];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    expected = generatedSlice;
    assert.deepEqual(actual, expected);

    // 2 anomalies in 1,3 positions
    generatedSlice = [19, 41, 21, 42, 23];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    let validResults = [
        [41, 19, 42, 21, 23],
        [41, 19, 21, 23, 42],
        [19, 21, 41, 42, 23],
        [19, 21, 41, 23, 42],
    ];
    assert.ok(validResults.some((result) => lodash.isEqual(result, actual)));

    // 2 anomalies in 3,4 positions
    generatedSlice = [19, 20, 21, 41, 42];
    actual = MiltySliceGenerator.fixAdjAnomalies(generatedSlice);
    validResults = [
        [41, 20, 42, 19, 21],
        [41, 20, 21, 19, 42],
        [19, 20, 41, 42, 21],
        [19, 20, 41, 21, 42],
    ];
    assert.ok(validResults.some((result) => lodash.isEqual(result, actual)));

    // result should not change if called twice
    expected = lodash.clone(actual);
    actual = MiltySliceGenerator.fixAdjAnomalies(actual);
    assert.deepEqual(actual, expected);
});
