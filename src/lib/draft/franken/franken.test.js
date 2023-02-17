require("../../../global"); // register world.TI4
const assert = require("assert");
const { FACTION_ABILITIES, UNDRAFTABLE } = require("./franken.data");
const { Franken } = require("./franken");
const { FactionAbilitySchema, UndraftableSchema } = require("./franken.schema");

it("faction abilities", () => {
    for (const ability of FACTION_ABILITIES) {
        assert(FactionAbilitySchema.validate(ability));
    }
});

it("undraftable", () => {
    for (const undraftable of UNDRAFTABLE) {
        assert(UndraftableSchema.validate(undraftable));
    }
});

it("faction abilityNameToNsidName", () => {
    let result;

    result = Franken.abilityNameToNsidName("Aetherpassage");
    assert.equal(result, "aetherpassage");

    result = Franken.abilityNameToNsidName("Blood Ties");
    assert.equal(result, "blood_ties");

    result = Franken.abilityNameToNsidName("Law's Order");
    assert.equal(result, "laws_order");
});

it("getUndraftableNSIDs", () => {
    const undraftableNSIDs = Franken.getUndraftableNSIDs();
    assert(
        undraftableNSIDs.has(
            "card.promissory.mentak:base/promise_of_protection"
        )
    );
    assert(undraftableNSIDs.has("card.alliance:codex.vigil/keleres_xxcha"));
});
