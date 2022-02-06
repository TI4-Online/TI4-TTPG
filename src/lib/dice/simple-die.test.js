const assert = require("assert");
const { SimpleDieBuilder, SimpleDie } = require("./simple-die");

it("roll callback", () => {
    let didCallback = false;
    const callback = (simpleDie) => {
        didCallback = true;
    };
    const simpleDie = new SimpleDieBuilder().setCallback(callback).build();
    simpleDie.setValue(1); // fake roll
    assert(didCallback);
});
