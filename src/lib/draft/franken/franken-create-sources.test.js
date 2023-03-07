require("../../../global"); // register world.TI4
const assert = require("assert");
const { _abilityNameToNsidName } = require("./franken-create-sources");

it("faction abilityNameToNsidName", () => {
    let result;

    result = _abilityNameToNsidName("Aetherpassage");
    assert.equal(result, "aetherpassage");

    result = _abilityNameToNsidName("Blood Ties");
    assert.equal(result, "blood_ties");

    result = _abilityNameToNsidName("Law's Order");
    assert.equal(result, "laws_order");
});
