const assert = require("assert");
const { FactionSchema } = require("./faction.schema");

it("validate good", () => {
    const faction = {
        faction: "my_faction",
        source: "homebrew.unittest",
        abilities: [],
        commodities: 4,
        home: 18,
        leaders: {
            agents: [],
            commanders: [],
            heroes: [],
            mechs: [],
        },
        promissoryNotes: [],
        techs: [],
        units: [],
        startingTech: [],
        startingUnits: {},
    };
    assert(FactionSchema.validate(faction));
});

it("validate bad", () => {
    const faction = {};
    assert(!FactionSchema.validate(faction, (err) => {}));
});
