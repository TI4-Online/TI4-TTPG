const FACTION_DATA = [
    {
        faction: "arborec",
        source: "base",
        abilities: ["mitosis"],
        commodoties: 4,
        home: 18,
        leaders: {
            agents: ["letani_ospha"],
            commanders: ["dirzuga_rophal"],
            heroes: ["letani_miasmiala"],
        },
        promissoryNotes: ["stymie"], // setup handles omega
        techs: ["bioplasmosis"],
        units: [
            "letani_warrior",
            "letani_warrior_2",
            "duha_menaimon",
            "letani_behemoth",
        ],
        startingTech: ["magen_defense_grid"],
        startingUnits: {
            infantry: 4,
            fighter: 2,
            cruiser: 1,
            carrier: 1,
            space_dock: 1,
            pds: 1,
        },
    },
];

module.exports = { FACTION_DATA };
