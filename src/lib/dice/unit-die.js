const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { SimpleDieBuilder, SimpleDie } = require("./simple-die");
const { UnitAttrs } = require("../unit/unit-attrs");
const { Color, Player } = require("../../wrapper/api");

/**
 * Dice suited for a unit rollType (e.g. "spaceCombat").
 */
class UnitDieBuilder extends SimpleDieBuilder {
    /**
     * Constructor.
     *
     * @param {UnitAttrs} unitAttrs
     * @param {string} rollType - antiFighterBarrage, etc
     */
    constructor(unitAttrs, rollType) {
        assert(unitAttrs instanceof UnitAttrs);
        assert(typeof rollType === "string");
        super();

        this.setName(locale(unitAttrs.raw.localeName));
        const color = unitAttrs.raw.diceColor;
        if (color) {
            this.setColor(new Color(color.r, color.g, color.b, color.a));
        }

        const rollAttrs = unitAttrs.raw[rollType];
        assert(rollAttrs);
        assert(rollAttrs.hit);
        this.setHitValue(rollAttrs.hit);

        if (rollAttrs.extraHitsOn) {
            assert(rollAttrs.extraHitsOn.value);
            this.setCritValue(rollAttrs.extraHitsOn.value);
            this.setCritCount(rollAttrs.extraHitsOn.count || 1);
        }

        if (rollAttrs.rerollMisses) {
            this.setReroll(true);
        }
    }

    /**
     * Create the die wrapper and die GameObject.
     *
     * @param {Player} player
     * @returns {UnitDie}
     */
    build(player) {
        assert(player instanceof Player);
        return new UnitDie(this, player);
    }
}

class UnitDie extends SimpleDie {
    constructor(builder, player) {
        assert(builder instanceof UnitDieBuilder);
        assert(player instanceof Player);
        super(builder, player);
    }
}

module.exports = { UnitDieBuilder, UnitDie };
