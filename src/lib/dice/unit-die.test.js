require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const locale = require("../locale");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitDieBuilder, UnitDie } = require("./unit-die");
const { MockPlayer } = require("../../wrapper/api");

it("fighter", () => {
    const unitAttrs = UnitAttrs.getDefaultUnitAttrs("fighter");
    assert.equal(unitAttrs.raw.spaceCombat.hit, 9);

    const player = new MockPlayer();
    const unitDie = new UnitDieBuilder(unitAttrs, "spaceCombat").build(player);
    assert(unitDie instanceof UnitDie);
    assert.equal(unitDie.getHitValue(), 9);
    assert.equal(unitDie._die.getName(), locale(unitAttrs.raw.localeName));
});
