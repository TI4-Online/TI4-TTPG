const assert = require("assert");
const { FactionAbilitySchema, UndraftableSchema } = require("./franken.schema");

it("FactionAbilitySchema", () => {
    const ability = {
        name: "My Ability Name",
        description: "Blah blah.",
        source: "Origianl Faction Here",
    };
    assert(FactionAbilitySchema.validate(ability));
});

it("UndraftableSchema", () => {
    const undraftable = {
        name: "My Name",
        nsid: "type:source/name",
        count: 1,
    };
    assert(UndraftableSchema.validate(undraftable));
});
