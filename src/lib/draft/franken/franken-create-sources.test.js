require("../../../global"); // register world.TI4
const assert = require("assert");
const { FrankenCreateSources } = require("./franken-create-sources");

it("faction abilityNameToNsidName", () => {
    let result;

    result = FrankenCreateSources.abilityNameToNsidName("Aetherpassage");
    assert.equal(result, "aetherpassage");

    result = FrankenCreateSources.abilityNameToNsidName("Blood Ties");
    assert.equal(result, "blood_ties");

    result = FrankenCreateSources.abilityNameToNsidName("Law's Order");
    assert.equal(result, "laws_order");
});
