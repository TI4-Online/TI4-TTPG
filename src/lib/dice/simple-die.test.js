const assert = require("assert");
const { SimpleDieBuilder, SimpleDie } = require("./simple-die");

it("roll callback", () => {
    let didCallback = false;
    const callback = (simpleDie) => {
        assert(simpleDie instanceof SimpleDie);
        assert(simpleDie.hasValue());
        assert.equal(simpleDie.getValue(), 1);
        didCallback = true;
    };
    const simpleDie = new SimpleDieBuilder().setCallback(callback).build();
    assert(!simpleDie.hasValue());
    simpleDie.setValue(1); // fake roll
    assert(didCallback);
});
