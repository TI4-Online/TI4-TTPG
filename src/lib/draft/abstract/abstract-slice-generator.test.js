require("../../../global"); // creates world.TI4
const assert = require("assert");
const { AbstractSliceGenerator } = require("./abstract-slice-generator");

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
