// the "it(string, function)" style works with mocha and jest frameworks
const { validate, parse, format } = require("./map-string-parser");
const assert = require("assert");

// test validation
it("validate with numeric only", () => {
    assert.equal(validate("7 18 23"), true);
});

it("validate with custom home tile", () => {
    assert.equal(validate("{4} 7 18 23"), true);
});

it("validate with side and rotation", () => {
    assert.equal(validate("7 83b2"), true);
});

it("validate supports multiple and mixed delimiters", () => {
    assert.deepEqual(validate("{4}   ,7   18,   23"), true);
});

it("validate supports upper or lower case side values", () => {
    assert.equal(validate("7 83B2"), true);
});

it("validate does not support invalid map string", () => {
    assert.notEqual(validate("7 83b2 75b"), true);
});

it("validate does not support invalid characters", () => {
    assert.notEqual(validate("{4} ^  ,7 $  18,   23"), true);
});

// test parsing
it("parse with numeric only", () => {
    assert.deepEqual(parse("7 18 23"), [
        { tile: 18 },
        { tile: 7 },
        { tile: 18 },
        { tile: 23 },
    ]);
});

it("parse with custom home tile", () => {
    assert.deepEqual(parse("{4} 7 18 23"), [
        { tile: 4 },
        { tile: 7 },
        { tile: 18 },
        { tile: 23 },
    ]);
});

it("parse with side and rotation", () => {
    assert.deepEqual(parse("7 83b2"), [
        { tile: 18 },
        { tile: 7 },
        { tile: 83, side: "b", rotation: 2 },
    ]);
});

it("parse supports multiple and mixed delimiters", () => {
    assert.deepEqual(parse("{4}   ,7   18,   23"), [
        { tile: 4 },
        { tile: 7 },
        { tile: 18 },
        { tile: 23 },
    ]);
});

it("validate supports upper or lower case side values", () => {
    assert.deepEqual(parse("7 83B2"), [
        { tile: 18 },
        { tile: 7 },
        { tile: 83, side: "b", rotation: 2 },
    ]);
});

it("parse throws for invalid map string", () => {
    assert.throws(() => parse("7 83b2 75b"));
});

it("parse throws for support invalid characters", () => {
    assert.throws(() => parse("{4} ^  ,7 $  18,   23"));
});

// test formatting
it("format with numeric only", () => {
    assert.equal(
        format([{ tile: 18 }, { tile: 7 }, { tile: 18 }, { tile: 23 }]),
        "7 18 23"
    );
});

it("format with custom home tile", () => {
    assert.equal(
        format([{ tile: 4 }, { tile: 7 }, { tile: 18 }, { tile: 23 }]),
        "{4} 7 18 23"
    );
});

it("format with side and rotation", () => {
    assert.equal(
        format([
            { tile: 18 },
            { tile: 7 },
            { tile: 83, side: "b", rotation: 2 },
        ]),
        "7 83b2"
    );
});
