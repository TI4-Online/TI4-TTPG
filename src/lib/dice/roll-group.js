const assert = require("../../wrapper/assert");
const { SimpleDie } = require("./simple-die");
const { Player } = require("../../wrapper/api");

class RollGroupBuilder {
    constructor() {
        this._dice = [];
    }

    addDice(dice) {
        assert(Array.isArray(dice));
        dice.forEach((die) => {
            assert(die instanceof SimpleDie);
        });
        this._dice.push(...dice);
    }
}

class RollGroup {
    constructor(rollGroupBuilder, player) {
        assert(rollGroupBuilder instanceof RollGroupBuilder);
        assert(player instanceof Player);

        this._dice = rollGroupBuilder._dice;
        rollGroupBuilder._dice = []; // take control of the dice
    }

    onDieCallback(simpleDie) {
        for (const die of this._dice) {
            if (!die.hasValue()) {
                return; // roll still in progress
            }
        }
        this._callback(this._dice);
    }

    roll(callback) {}
}

module.exports = { RollGroup };
