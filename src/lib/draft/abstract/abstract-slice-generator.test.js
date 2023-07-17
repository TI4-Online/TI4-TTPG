require("../../../global"); // creates world.TI4
const assert = require("assert");
const {
    AbstractSliceGenerator,
    SLICE_SHAPES,
} = require("./abstract-slice-generator");

it("_hasAdjacentAnomalies", () => {
    const miltyShape = [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ];
    const slice1 = [1, 2, 3, 4, 5];
    const slice2 = [41, 42, 1, 2, 3];

    assert(!AbstractSliceGenerator._hasAdjacentAnomalies(miltyShape, slice1));
    assert(AbstractSliceGenerator._hasAdjacentAnomalies(miltyShape, slice2));
});

it("_separateAnomalies", () => {
    const miltyShape = [
        "<0,0,0>", // home system
        "<1,-1,0>", // left
        "<1,0,-1>", // front
        "<0,1,-1>", // right
        "<2,-1,-1>", // left-eq
        "<2,0,-2>", // front-far
    ];
    const slice = [41, 42, 1, 2, 3];

    const newSlice = AbstractSliceGenerator._separateAnomalies(
        miltyShape,
        slice
    );

    assert(!AbstractSliceGenerator._hasAdjacentAnomalies(miltyShape, newSlice));
});

it("permutator", () => {
    const array = [1, 2, 3];
    const result = [];
    AbstractSliceGenerator._permutator(array, (permutation) => {
        result.push(permutation);
    });
    assert.deepEqual(result, [
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1],
    ]);
});

it("weightedChoice", () => {
    const options = [
        { weight: 1, value: "a" },
        { weight: 3, value: "b" },
        { weight: 6, value: "c" },
    ];
    let a = 0,
        b = 0,
        c = 0;
    for (let i = 0; i < 1000; i++) {
        const value = AbstractSliceGenerator._weightedChoice(options);
        if (value === "a") {
            a++;
        } else if (value === "b") {
            b++;
        } else if (value === "c") {
            c++;
        } else {
            throw new Error("invalid");
        }
    }
    //console.log(`${a}/${b}/${c}`);
    assert(a < b / 2);
    assert(a < c / 4);
});

it("parseCustomSlices", () => {
    const shape = SLICE_SHAPES.milty;

    // All valid.
    let custom = "foo&slices=1,2,3,4,5|6,7,8,9,10";
    let errors = [];
    let slices = AbstractSliceGenerator.parseCustomSlices(
        custom,
        shape,
        errors
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);

    // Slices can be given without descriminator.
    custom = "1,2,3,4,5|6,7,8,9,10&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, []);
    assert.deepEqual(slices, [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
    ]);

    // bad slice.
    custom = "1,2,3,4,5|6,7,8,9,10,11,12&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, ["slice length (7) must be 5"]);
    assert.deepEqual(slices, [[1, 2, 3, 4, 5]]);

    // bad slice 2.
    custom = "1,2,3,4,5|6,7,8,9,ten&foo";
    errors = [];
    slices = AbstractSliceGenerator.parseCustomSlices(custom, shape, errors);
    assert.deepEqual(errors, ['Slice entry "ten" is not a number']);
    assert.deepEqual(slices, [[1, 2, 3, 4, 5]]);
});

it("parseCustomLabels", () => {
    const sliceCount = 2;

    // All valid.
    let custom = "foo&labels=one|two";
    let errors = [];
    let labels = AbstractSliceGenerator.parseCustomLabels(
        custom,
        sliceCount,
        errors
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(labels, ["one", "two"]);

    custom = "foo&labels=one";
    errors = [];
    labels = AbstractSliceGenerator.parseCustomLabels(
        custom,
        sliceCount,
        errors
    );
    assert.deepEqual(errors, [
        "label count (1) does not match slice count (2)",
    ]);
    assert.deepEqual(labels, ["one"]);
});
