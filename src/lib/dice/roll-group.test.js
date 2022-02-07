const assert = require("assert");
const { RollGroup } = require("./roll-group");
const { SimpleDieBuilder } = require("./simple-die");
const { MockPlayer } = require("../../wrapper/api");

it("roll", () => {
    const player = new MockPlayer();
    const dice = [
        new SimpleDieBuilder().build(player),
        new SimpleDieBuilder().build(player),
    ];
    for (const die of dice) {
        assert(!die.isRolling());
    }

    let didCallback = false;
    const callback = () => {
        didCallback = true;
    };

    RollGroup.roll(dice, callback);
    for (const die of dice) {
        assert(die.isRolling());
    }

    // All dice are still rolling.
    assert(!didCallback);

    // Finish first roll.
    dice[0].finishRoll();
    assert(!didCallback);

    // Finish second roll, expect group callback.
    dice[1].finishRoll();
    assert(didCallback);
});
