const assert = require("assert");
const { FactionSchema } = require("./faction.schema");
const { FACTION_DATA } = require("./faction.data");

it("FACTION_DATA schema", () => {
    FACTION_DATA.forEach((faction) => {
        assert(FactionSchema.validate(faction));
    });
});
