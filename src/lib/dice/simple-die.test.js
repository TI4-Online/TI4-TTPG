const assert = require("assert");
const { SimpleDieBuilder, SimpleDie } = require("./simple-die");
const { MockPlayer } = require("../../wrapper/api");

it("roll callback", () => {
    let didCallback = false;
    const callback = (simpleDie) => {
        assert(simpleDie instanceof SimpleDie);
        didCallback = true;
    };

    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder().build(player);
    assert(!simpleDie.isRolling());

    simpleDie.roll(callback);
    assert(simpleDie.isRolling());

    // globalEvents.onDiceRolled triggers simpleDie.finishRoll()
    simpleDie.finishRoll();
    assert(!simpleDie.isRolling());
    assert(didCallback);
});

it("reroll not needed", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setReroll(true)
        .build(player);

    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(6); // value is index+1
    simpleDie.finishRoll();
    assert(!simpleDie.isRolling());
    assert(!simpleDie.isReroll());
    assert.equal(simpleDie.getValue(), 7);
});
it("reroll", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setReroll(true)
        .build(player);

    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(1); // value is index+1
    simpleDie.finishRoll();
    assert(simpleDie.isRolling());
    assert.equal(simpleDie.getValue(), 2); // rerolling this value

    simpleDie._die.setCurrentFace(2); // value is index+1
    simpleDie.finishRoll();
    assert(!simpleDie.isRolling());
    assert(simpleDie.isReroll());
    assert.equal(simpleDie.getValue(), 3);
});

it("getValueString miss", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setCritValue(8)
        .build(player);

    // Roll to register onDiceRolled handler, then trigger it to set value.
    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(3); // value is index+1
    simpleDie.finishRoll();

    assert.equal(simpleDie.getValue(), 4);
    assert.equal(simpleDie.getValueStr(), "4");
});

it("getValueString hit", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setCritValue(8)
        .build(player);

    // Roll to register onDiceRolled handler, then trigger it to set value.
    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(5); // value is index+1
    simpleDie.finishRoll();

    assert.equal(simpleDie.getValue(), 6);
    assert.equal(simpleDie.countHits(), 1);
    assert.equal(simpleDie.getValueStr(), "6#");
});

it("getValueString crit", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setCritValue(8)
        .setCritCount(2)
        .build(player);

    // Roll to register onDiceRolled handler, then trigger it to set value.
    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(8); // value is index+1
    simpleDie.finishRoll();

    assert.equal(simpleDie.getValue(), 9);
    assert.equal(simpleDie.countHits(), 3);
    assert.equal(simpleDie.getValueStr(), "9###");
});

it("getValueString reroll", () => {
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder()
        .setHitValue(5)
        .setReroll(true)
        .build(player);

    // Roll to register onDiceRolled handler, then trigger it to set value.
    simpleDie.roll((simpleDie) => {});
    simpleDie._die.setCurrentFace(1); // value is index+1
    simpleDie.finishRoll();
    assert.equal(simpleDie.getValue(), 2);

    // First roll missed, internally called roll again.  Apply value, trigger.
    simpleDie._die.setCurrentFace(2); // value is index+1
    simpleDie.finishRoll();
    assert.equal(simpleDie.getValue(), 3);

    assert.equal(simpleDie.getValueStr(), "2->3");
});

it("set/get auxObject", () => {
    const aux = "foo";
    const player = new MockPlayer();
    const simpleDie = new SimpleDieBuilder().setAuxObject(aux).build(player);
    assert.equal(simpleDie.getAuxObject(), aux);
});
