require("../../global"); // create world.TI4
const assert = require("assert");
const { world } = require("../../wrapper/api");

it("world wiring", () => {
    assert(world.TI4.homebrew);
});

it("inject", () => {
    const myFaction = {
        faction: "my_faction",
        source: "homebrew.foo",
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
        icon: "global/factions/homebrew_faction_name.png",
        techs: [],
        units: [],
        startingTech: [],
        startingUnits: {},
    };
    const myTechnology1 = {
        localeName: "unit.infantry.homebrew_warrior_2",
        cardNsid:
            "card.technology.unit_upgrade.homebrew_faction_name:homebrew.foo/homebrew_warrior_2",
        type: "unitUpgrade",
        requirements: {
            Green: 1,
        },
        abbrev: "Homebrew II",
        faction: "homebrew_faction_name",
        unitPosition: 10,
    };

    world.TI4.homebrew.inject({
        factions: [myFaction],
        technologies: [myTechnology1],
    });
});

it("other scorable", () => {
    const otherScorable = ["type:source/name"];
    world.TI4.homebrew.inject({ otherScorable });
});
