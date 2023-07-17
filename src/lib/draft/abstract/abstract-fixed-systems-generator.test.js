require("../../../global"); // creates world.TI4
const assert = require("assert");
const {
    AbstractFixedSystemsGenerator,
} = require("./abstract-fixed-systems-generator");

it("parseCustomFixedSystems", () => {
    const fixedCount = 2;

    // All valid.
    let custom = "foo&fixed=1,2";
    let errors = [];
    let fixed = AbstractFixedSystemsGenerator.parseCustomFixedSystems(
        custom,
        fixedCount,
        errors
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(fixed, [1, 2]);

    custom = "foo&fixed=1";
    errors = [];
    fixed = AbstractFixedSystemsGenerator.parseCustomFixedSystems(
        custom,
        fixedCount,
        errors
    );
    assert.deepEqual(errors, [
        "fixed system count (1) does not match required count (2)",
    ]);
    assert.deepEqual(fixed, [1]);

    custom = "foo&fixed=1,two";
    errors = [];
    fixed = AbstractFixedSystemsGenerator.parseCustomFixedSystems(
        custom,
        fixedCount,
        errors
    );
    assert.deepEqual(errors, ['Fixed system entry "two" is not a number']);
    assert.deepEqual(fixed, [1]);
});
