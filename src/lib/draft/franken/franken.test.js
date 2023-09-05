require("../../../global"); // register world.TI4
const assert = require("assert");
const { FACTION_ABILITIES, UNDRAFTABLE } = require("./franken.data");
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
