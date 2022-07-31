const assert = require("assert");
const assertWrapper = require("./assert-wrapper");

it("basic", () => {
    assertWrapper(true);
    assert.throws(() => assertWrapper(false));
});

it("equal", () => {
    assertWrapper.equal(1, 1);
    assert.throws(() => assertWrapper.equal(1, 2));
});
