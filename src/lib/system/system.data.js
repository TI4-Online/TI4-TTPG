module.exports = [
    // base systems
    {
        tile: 1,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.jord", resources: 4, influence: 2 }],
    },
    {
        tile: 2,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.moll_primus", resources: 4, influence: 1 },
        ],
    },
    {
        tile: 3,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.darien", resources: 4, influence: 4 }],
    },
    {
        tile: 4,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.muaat", resources: 4, influence: 1 }],
    },
    {
        tile: 5,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.nestphar", resources: 3, influence: 2 },
        ],
    },
    {
        tile: 6,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.000", resources: 5, influence: 0 }],
    },
    {
        tile: 7,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.winnu", resources: 3, influence: 4 }],
    },
    {
        tile: 8,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.mordai_ii", resources: 4, influence: 0 },
        ],
    },
    {
        tile: 9,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.maaluuk", resources: 0, influence: 2 },
            { localeName: "planet.druaa", resources: 3, influence: 1 },
        ],
    },
    {
        tile: 10,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.arc_prime", resources: 4, influence: 0 },
            { localeName: "planet.wren_terra", resources: 2, influence: 1 },
        ],
    },
    {
        tile: 11,
        source: "base",
        home: true,
        planets: [
            {
                localeName: "planet.lisis_ii",
                resources: 1,
                influence: 0,
                radius: 1.75,
            },
            {
                localeName: "planet.ragh",
                resources: 2,
                influence: 1,
                position: { x: -1.8, y: 1.75 },
                radius: 1.75,
            },
        ],
    },
    {
        tile: 12,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.nar", resources: 2, influence: 3 },
            { localeName: "planet.jol", resources: 1, influence: 2 },
        ],
    },
    {
        tile: 13,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.trenlak", resources: 1, influence: 0 },
            { localeName: "planet.quinarra", resources: 3, influence: 1 },
        ],
    },
    {
        tile: 14,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.archon_ren", resources: 2, influence: 3 },
            { localeName: "planet.archon_tau", resources: 1, influence: 1 },
        ],
    },
    {
        tile: 15,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.retillion", resources: 2, influence: 3 },
            { localeName: "planet.shalloq", resources: 1, influence: 2 },
        ],
    },
    {
        tile: 16,
        source: "base",
        home: true,
        planets: [
            {
                localeName: "planet.hercant",
                resources: 1,
                influence: 1,
                position: { x: 0.5, y: -2.75 },
            },
            {
                localeName: "planet.arretze",
                resources: 2,
                influence: 0,
                position: { x: 2.3, y: 1.3 },
            },
            {
                localeName: "planet.kamdorn",
                resources: 0,
                influence: 1,
                position: { x: -2.4, y: 1.9 },
            },
        ],
    },
    {
        // not precisely a home, but tied to a faction
        tile: 17,
        source: "base",
        home: true,
        wormholes: ["delta"],
    },
    {
        tile: 18,
        source: "base",
        planets: [
            {
                localeName: "planet.mecatol_rex",
                resources: 1,
                influence: 6,
                radius: 4,
            },
        ],
    },
    {
        tile: 19,
        source: "base",
        planets: [
            {
                localeName: "planet.wellon",
                resources: 1,
                influence: 2,
                trait: ["industrial"],
                tech: ["yellow"],
            },
        ],
    },
    {
        tile: 20,
        source: "base",
        planets: [
            {
                localeName: "planet.vefut_ii",
                resources: 2,
                influence: 2,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 21,
        source: "base",
        planets: [
            {
                localeName: "planet.thibah",
                resources: 1,
                influence: 1,
                trait: ["industrial"],
                tech: ["blue"],
            },
        ],
    },
    {
        tile: 22,
        source: "base",
        planets: [
            {
                localeName: "planet.tarmann",
                resources: 1,
                influence: 1,
                trait: ["industrial"],
                tech: ["green"],
            },
        ],
    },
    {
        tile: 23,
        source: "base",
        planets: [
            {
                localeName: "planet.saudor",
                resources: 2,
                influence: 2,
                trait: ["industrial"],
            },
        ],
    },
    {
        tile: 24,
        source: "base",
        planets: [
            {
                localeName: "planet.mehar_xull",
                resources: 1,
                influence: 3,
                trait: ["hazardous"],
                tech: ["red"],
            },
        ],
    },
    {
        tile: 25,
        source: "base",
        wormholes: ["beta"],
        planets: [
            {
                localeName: "planet.quann",
                resources: 2,
                influence: 1,
                trait: ["cultural"],
                position: { x: 2, y: -1.25 },
            },
        ],
    },
    {
        tile: 26,
        source: "base",
        wormholes: ["alpha"],
        planets: [
            {
                localeName: "planet.lodor",
                resources: 3,
                influence: 1,
                trait: ["cultural"],
                position: { x: 2, y: -1.25 },
            },
        ],
    },
    {
        tile: 27,
        source: "base",
        planets: [
            {
                localeName: "planet.new_albion",
                resources: 1,
                influence: 1,
                trait: ["industrial"],
                tech: ["green"],
            },
            {
                localeName: "planet.starpoint",
                resources: 3,
                influence: 1,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 28,
        source: "base",
        planets: [
            {
                localeName: "planet.tequran",
                resources: 2,
                influence: 0,
                trait: ["hazardous"],
            },
            {
                localeName: "planet.torkan",
                resources: 0,
                influence: 3,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 29,
        source: "base",
        planets: [
            {
                localeName: "planet.qucenn",
                resources: 1,
                influence: 2,
                trait: ["industrial"],
            },
            {
                localeName: "planet.rarron",
                resources: 0,
                influence: 3,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 30,
        source: "base",
        planets: [
            {
                localeName: "planet.mellon",
                resources: 0,
                influence: 2,
                trait: ["cultural"],
            },
            {
                localeName: "planet.zohbat",
                resources: 3,
                influence: 1,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 31,
        source: "base",
        planets: [
            {
                localeName: "planet.lazar",
                resources: 1,
                influence: 0,
                trait: ["industrial"],
                tech: ["yellow"],
            },
            {
                localeName: "planet.sakulag",
                resources: 2,
                influence: 1,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 32,
        source: "base",
        planets: [
            {
                localeName: "planet.dal_bootha",
                resources: 0,
                influence: 2,
                trait: ["cultural"],
            },
            {
                localeName: "planet.xxehan",
                resources: 1,
                influence: 1,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 33,
        source: "base",
        planets: [
            {
                localeName: "planet.corneeq",
                resources: 1,
                influence: 2,
                trait: ["cultural"],
            },
            {
                localeName: "planet.resculon",
                resources: 2,
                influence: 0,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 34,
        source: "base",
        planets: [
            {
                localeName: "planet.centauri",
                resources: 1,
                influence: 3,
                trait: ["cultural"],
            },
            {
                localeName: "planet.gral",
                resources: 1,
                influence: 1,
                trait: ["industrial"],
                tech: ["blue"],
            },
        ],
    },
    {
        tile: 35,
        source: "base",
        planets: [
            {
                localeName: "planet.bereg",
                resources: 3,
                influence: 1,
                trait: ["hazardous"],
            },
            {
                localeName: "planet.lirta_iv",
                resources: 2,
                influence: 3,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 36,
        source: "base",
        planets: [
            {
                localeName: "planet.arnor",
                resources: 2,
                influence: 1,
                trait: ["industrial"],
            },
            {
                localeName: "planet.lor",
                resources: 1,
                influence: 2,
                trait: ["industrial"],
            },
        ],
    },
    {
        tile: 37,
        source: "base",
        planets: [
            {
                localeName: "planet.arinam",
                resources: 1,
                influence: 2,
                trait: ["industrial"],
            },
            {
                localeName: "planet.meer",
                resources: 0,
                influence: 4,
                trait: ["hazardous"],
                tech: ["red"],
            },
        ],
    },
    {
        tile: 38,
        source: "base",
        planets: [
            {
                localeName: "planet.abyz",
                resources: 3,
                influence: 0,
                trait: ["hazardous"],
            },
            {
                localeName: "planet.fria",
                resources: 2,
                influence: 0,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 39,
        source: "base",
        wormholes: ["alpha"],
    },
    {
        tile: 40,
        source: "base",
        wormholes: ["beta"],
    },
    {
        tile: 41,
        source: "base",
        anomalies: ["gravity rift"],
    },
    {
        tile: 42,
        source: "base",
        anomalies: ["nebula"],
    },
    {
        tile: 43,
        source: "base",
        anomalies: ["supernova"],
    },
    {
        tile: 44,
        source: "base",
        anomalies: ["asteroid field"],
    },
    {
        tile: 45,
        source: "base",
        anomalies: ["asteroid field"],
    },
    {
        tile: 46,
        source: "base",
    },
    {
        tile: 47,
        source: "base",
    },
    {
        tile: 48,
        source: "base",
    },
    {
        tile: 49,
        source: "base",
    },
    {
        tile: 50,
        source: "base",
    },
    {
        tile: 51,
        source: "base",
        home: true,
        wormholes: ["delta"],
        offMap: true,
        planets: [
            {
                localeName: "planet.creuss",
                resources: 4,
                influence: 2,
                position: { x: 1, y: 0 },
            },
        ],
    },

    // pok systems
    {
        tile: 52,
        source: "pok",
        home: true,
        planets: [{ localeName: "planet.ixth", resources: 3, influence: 5 }],
    },
    {
        tile: 53,
        source: "pok",
        home: true,
        planets: [
            { localeName: "planet.arcturus", resources: 4, influence: 4 },
        ],
    },
    {
        tile: 54,
        source: "pok",
        home: true,
        planets: [{ localeName: "planet.acheron", resources: 4, influence: 0 }],
    },
    {
        tile: 55,
        source: "pok",
        home: true,
        planets: [
            {
                localeName: "planet.elysium",
                resources: 4,
                influence: 1,
                position: { x: 0.75, y: 0 },
                radius: 3.25,
            },
        ],
    },
    {
        tile: 56,
        source: "pok",
        home: true,
        anomalies: ["nebula"],
        planets: [
            { localeName: "planet.the_dark", resources: 3, influence: 4 },
        ],
    },
    {
        tile: 57,
        source: "pok",
        home: true,
        planets: [
            { localeName: "planet.naazir", resources: 2, influence: 1 },
            { localeName: "planet.rokha", resources: 1, influence: 2 },
        ],
    },
    {
        tile: 58,
        source: "pok",
        home: true,
        planets: [
            {
                localeName: "planet.valk",
                resources: 2,
                influence: 0,
                position: { x: 0.5, y: -2.75 },
            },
            {
                localeName: "planet.ylir",
                resources: 0,
                influence: 2,
                position: { x: 2.3, y: 1.3 },
            },
            {
                localeName: "planet.avar",
                resources: 1,
                influence: 1,
                position: { x: -2.5, y: 1.7 },
            },
        ],
    },
    {
        tile: 59,
        source: "pok",
        planets: [
            {
                localeName: "planet.archon_vail",
                resources: 1,
                influence: 3,
                trait: ["hazardous"],
                tech: ["blue"],
            },
        ],
    },
    {
        tile: 60,
        source: "pok",
        planets: [
            {
                localeName: "planet.perimeter",
                resources: 2,
                influence: 1,
                trait: ["industrial"],
            },
        ],
    },
    {
        tile: 61,
        source: "pok",
        planets: [
            {
                localeName: "planet.ang",
                resources: 2,
                influence: 0,
                trait: ["industrial"],
                tech: ["red"],
            },
        ],
    },
    {
        tile: 62,
        source: "pok",
        planets: [
            {
                localeName: "planet.semlore",
                resources: 3,
                influence: 2,
                trait: ["cultural"],
                tech: ["yellow"],
            },
        ],
    },
    {
        tile: 63,
        source: "pok",
        planets: [
            {
                localeName: "planet.vorhal",
                resources: 0,
                influence: 2,
                trait: ["cultural"],
                tech: ["green"],
            },
        ],
    },
    {
        tile: 64,
        source: "pok",
        wormholes: ["beta"],
        planets: [
            {
                localeName: "planet.atlas",
                resources: 3,
                influence: 1,
                trait: ["hazardous"],
                position: { x: 2, y: -1.25 },
            },
        ],
    },
    {
        tile: 65,
        source: "pok",
        planets: [
            {
                localeName: "planet.primor",
                resources: 2,
                influence: 1,
                trait: ["cultural"],
                radius: 3.25,
                legendary: true,
                legendaryCard: "card.legendary_planet:pok/the_atrament",
            },
        ],
    },
    {
        tile: 66,
        source: "pok",
        planets: [
            {
                localeName: "planet.hopes_end",
                resources: 3,
                influence: 0,
                trait: ["hazardous"],
                radius: 3.25,
                legendary: true,
                legendaryCard: "card.legendary_planet:pok/imperial_arms_vault",
            },
        ],
    },
    {
        tile: 67,
        source: "pok",
        anomalies: ["gravity rift"],
        planets: [
            {
                localeName: "planet.cormund",
                resources: 2,
                influence: 0,
                trait: ["hazardous"],
                position: { x: 0.7, y: -1 },
            },
        ],
    },
    {
        tile: 68,
        source: "pok",
        anomalies: ["nebula"],
        planets: [
            {
                localeName: "planet.everra",
                resources: 3,
                influence: 1,
                trait: ["cultural"],
                position: { x: 0.5, y: -1 },
            },
        ],
    },
    {
        tile: 69,
        source: "pok",
        planets: [
            {
                localeName: "planet.accoen",
                resources: 2,
                influence: 3,
                trait: ["industrial"],
            },
            {
                localeName: "planet.jeol_ir",
                resources: 2,
                influence: 3,
                trait: ["industrial"],
            },
        ],
    },
    {
        tile: 70,
        source: "pok",
        planets: [
            {
                localeName: "planet.kraag",
                resources: 2,
                influence: 1,
                trait: ["hazardous"],
            },
            {
                localeName: "planet.siig",
                resources: 0,
                influence: 2,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 71,
        source: "pok",
        planets: [
            {
                localeName: "planet.bakal",
                resources: 3,
                influence: 2,
                trait: ["industrial"],
            },
            {
                localeName: "planet.alio_prima",
                resources: 1,
                influence: 1,
                trait: ["cultural"],
            },
        ],
    },
    {
        tile: 72,
        source: "pok",
        planets: [
            {
                localeName: "planet.lisis",
                resources: 2,
                influence: 2,
                trait: ["industrial"],
            },
            {
                localeName: "planet.velnor",
                resources: 2,
                influence: 1,
                trait: ["industrial"],
                tech: ["red"],
            },
        ],
    },
    {
        tile: 73,
        source: "pok",
        planets: [
            {
                localeName: "planet.cealdri",
                resources: 0,
                influence: 2,
                trait: ["cultural"],
                tech: ["yellow"],
            },
            {
                localeName: "planet.xanhact",
                resources: 0,
                influence: 1,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 74,
        source: "pok",
        planets: [
            {
                localeName: "planet.vega_major",
                resources: 2,
                influence: 1,
                trait: ["cultural"],
            },
            {
                localeName: "planet.vega_minor",
                resources: 1,
                influence: 2,
                trait: ["cultural"],
                tech: ["blue"],
            },
        ],
    },
    {
        tile: 75,
        source: "pok",
        planets: [
            {
                localeName: "planet.loki",
                resources: 1,
                influence: 2,
                trait: ["cultural"],
            },
            {
                localeName: "planet.abaddon",
                resources: 1,
                influence: 0,
                trait: ["cultural"],
            },
            {
                localeName: "planet.ashtroth",
                resources: 2,
                influence: 0,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 76,
        source: "pok",
        planets: [
            {
                localeName: "planet.rigel_iii",
                resources: 1,
                influence: 1,
                trait: ["industrial"],
                tech: ["green"],
            },
            {
                localeName: "planet.rigel_ii",
                resources: 1,
                influence: 2,
                trait: ["industrial"],
            },
            {
                localeName: "planet.rigel_i",
                resources: 0,
                influence: 1,
                trait: ["hazardous"],
            },
        ],
    },
    {
        tile: 77,
        source: "pok",
    },
    {
        tile: 78,
        source: "pok",
    },
    {
        tile: 79,
        source: "pok",
        anomalies: ["asteroid field"],
        wormholes: ["alpha"],
    },
    {
        tile: 80,
        source: "pok",
        anomalies: ["supernova"],
    },
    {
        tile: 81,
        source: "pok",
        anomalies: ["supernova"], // muaat hero supernova tile
    },
    {
        tile: 82,
        source: "pok",
        wormholes: ["alpha", "beta", "gamma"],
        wormholesFaceDown: ["gamma"],
        offMap: true,
        planets: [
            {
                localeName: "planet.mallice",
                resources: 0,
                influence: 3,
                legendary: true,
                legendaryCard:
                    "card.legendary_planet:pok/exterric_headquarters",
                trait: ["cultural"],
                position: { x: 1.2, y: 1 },
            },
        ],
    },
    {
        tile: 83,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[3], [], [], [0], [], []],
        hyperlaneFaceDown: [[], [5], [4, 5], [], [2], [1, 2]],
    },
    {
        tile: 84,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [4], [], [], [1], []],
        hyperlaneFaceDown: [[2], [], [0, 5], [5], [], [2, 3]],
    },
    {
        tile: 85,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [3], [], [1], [], []],
        hyperlaneFaceDown: [[], [5], [4, 5], [], [2], [1, 2]],
    },
    {
        tile: 86,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [3], [], [1], [], []],
        hyperlaneFaceDown: [[2], [], [0, 5], [5], [], [2, 3]],
    },
    {
        tile: 87,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[4], [4], [4], [], [0, 1, 2], []],
        hyperlaneFaceDown: [[], [], [4, 5], [], [2], [2]],
    },
    {
        tile: 88,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2, 3, 4], [], [0], [0], [0], []],
        hyperlaneFaceDown: [[], [5], [4, 5], [], [2], [1, 2]],
    },
    {
        tile: 89,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2, 4], [], [0, 4], [], [0, 2], []],
        hyperlaneFaceDown: [[2], [], [0, 5], [], [], [2]],
    },
    {
        tile: 90,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[4], [3], [], [1], [0], []],
        hyperlaneFaceDown: [[2], [], [0, 5], [], [], [2]],
    },
    {
        tile: 91,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2], [], [0, 5], [5], [], [2, 3]],
        hyperlaneFaceDown: [[], [], [4, 5], [], [2], [2]],
    },
];
