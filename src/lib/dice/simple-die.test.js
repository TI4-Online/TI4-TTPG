const assert = require("assert");
const { SimpleDieBuilder, SimpleDie } = require("./simple-die");
const { MockPlayer } = require("../../wrapper/api");

it("roll callback", () => {
    let didCallback = false;
    const callback = (simpleDie) => {
        assert(simpleDie instanceof SimpleDie);
        assert(simpleDie.hasValue());
        assert.equal(simpleDie.getValue(), 1);
        didCallback = true;
    };

    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setCallback(callback)
        .build(player);

    assert(!simpleDie.hasValue());
    simpleDie.setValue(1); // fake roll
    assert(didCallback);
});
