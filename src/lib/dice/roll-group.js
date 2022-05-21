const assert = require("../../wrapper/assert-wrapper");
const { SimpleDie } = require("./simple-die");

class RollGroup {
    static roll(dice, callback) {
        assert(Array.isArray(dice));
        for (const die of dice) {
            assert(die instanceof SimpleDie);
        }
        assert(typeof callback === "function");

        const perDieCallback = (simpleDie) => {
            assert(simpleDie instanceof SimpleDie);
            for (const die of dice) {
                if (die.isRolling()) {
                    return;
                }
            }
            // All dice finished rolling!
            callback(dice);
        };

        for (const die of dice) {
            die.roll(perDieCallback);
        }
    }
}

/**
 * Does everything that RollGroup does, but allows each die to be associated
 * with an object. Used by AutoGravRiftRoller.
 *
 * Dice should now be an Array<Array> where each element of dice is
 * [SimpleDie, <thing to attach the roll result to>].
 */
class FancyRollGroup {
    static roll(dice, callback) {
        assert(Array.isArray(dice));
        for (const [die, obj] of dice) {
            assert(die instanceof SimpleDie);
        }
        assert(typeof callback === "function");

        const perDieCallback = (simpleDie) => {
            assert(simpleDie instanceof SimpleDie);
            for (const [die, _obj] of dice) {
                if (die.isRolling()) {
                    return;
                }
            }
            // All dice finished rolling!
            callback(dice);
        };

        for (const [die, _obj] of dice) {
            die.roll(perDieCallback);
        }
    }
}

module.exports = { RollGroup, FancyRollGroup };
