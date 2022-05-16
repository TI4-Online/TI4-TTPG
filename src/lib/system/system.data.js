module.exports = [
    // base systems
    {
        tile: 1,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.jord", resources: 4, influence: 2 }],
        img: "locale/ui/tiles/base/homeworld/tile_001.png",
    },
    {
        tile: 2,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.moll_primus", resources: 4, influence: 1 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_002.png",
    },
    {
        tile: 3,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.darien", resources: 4, influence: 4 }],
        img: "locale/ui/tiles/base/homeworld/tile_003.png",
    },
    {
        tile: 4,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.muaat", resources: 4, influence: 1 }],
        img: "locale/ui/tiles/base/homeworld/tile_004.png",
    },
    {
        tile: 5,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.nestphar", resources: 3, influence: 2 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_005.png",
    },
    {
        tile: 6,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.000", resources: 5, influence: 0 }],
        img: "locale/ui/tiles/base/homeworld/tile_006.png",
    },
    {
        tile: 7,
        source: "base",
        home: true,
        planets: [{ localeName: "planet.winnu", resources: 3, influence: 4 }],
        img: "locale/ui/tiles/base/homeworld/tile_007.png",
    },
    {
        tile: 8,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.mordai_ii", resources: 4, influence: 0 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_008.png",
    },
    {
        tile: 9,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.maaluuk", resources: 0, influence: 2 },
            { localeName: "planet.druaa", resources: 3, influence: 1 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_009.png",
    },
    {
        tile: 10,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.arc_prime", resources: 4, influence: 0 },
            { localeName: "planet.wren_terra", resources: 2, influence: 1 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_010.png",
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
        img: "locale/ui/tiles/base/homeworld/tile_011.png",
    },
    {
        tile: 12,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.nar", resources: 2, influence: 3 },
            { localeName: "planet.jol", resources: 1, influence: 2 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_012.png",
    },
    {
        tile: 13,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.trenlak", resources: 1, influence: 0 },
            { localeName: "planet.quinarra", resources: 3, influence: 1 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_013.png",
    },
    {
        tile: 14,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.archon_ren", resources: 2, influence: 3 },
            { localeName: "planet.archon_tau", resources: 1, influence: 1 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_014.png",
    },
    {
        tile: 15,
        source: "base",
        home: true,
        planets: [
            { localeName: "planet.retillion", resources: 2, influence: 3 },
            { localeName: "planet.shalloq", resources: 1, influence: 2 },
        ],
        img: "locale/ui/tiles/base/homeworld/tile_015.png",
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
        img: "locale/ui/tiles/base/homeworld/tile_016.png",
    },
    {
        // not precisely a home, but tied to a faction
        tile: 17,
        source: "base",
        home: true,
        wormholes: ["delta"],
        img: "locale/ui/tiles/base/homeworld/tile_017.png",
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
        img: "locale/ui/tiles/base/special/tile_018.png",
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
        img: "locale/ui/tiles/base/regular/tile_019.png",
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
        img: "locale/ui/tiles/base/regular/tile_020.png",
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
        img: "locale/ui/tiles/base/regular/tile_021.png",
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
        img: "locale/ui/tiles/base/regular/tile_022.png",
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
        img: "locale/ui/tiles/base/regular/tile_023.png",
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
        img: "locale/ui/tiles/base/regular/tile_024.png",
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
        img: "locale/ui/tiles/base/regular/tile_025.png",
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
        img: "locale/ui/tiles/base/regular/tile_026.png",
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
        img: "locale/ui/tiles/base/regular/tile_027.png",
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
        img: "locale/ui/tiles/base/regular/tile_028.png",
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
        img: "locale/ui/tiles/base/regular/tile_029.png",
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
        img: "locale/ui/tiles/base/regular/tile_030.png",
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
        img: "locale/ui/tiles/base/regular/tile_031.png",
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
        img: "locale/ui/tiles/base/regular/tile_032.png",
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
        img: "locale/ui/tiles/base/regular/tile_033.png",
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
        img: "locale/ui/tiles/base/regular/tile_034.png",
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
        img: "locale/ui/tiles/base/regular/tile_035.png",
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
        img: "locale/ui/tiles/base/regular/tile_036.png",
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
        img: "locale/ui/tiles/base/regular/tile_037.png",
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
        img: "locale/ui/tiles/base/regular/tile_038.png",
    },
    {
        tile: 39,
        source: "base",
        wormholes: ["alpha"],
        img: "global/ui/tiles/base/hazard/tile_039.png",
    },
    {
        tile: 40,
        source: "base",
        wormholes: ["beta"],
        img: "global/ui/tiles/base/hazard/tile_040.png",
    },
    {
        tile: 41,
        source: "base",
        anomalies: ["gravity rift"],
        img: "global/ui/tiles/base/hazard/tile_041.png",
    },
    {
        tile: 42,
        source: "base",
        anomalies: ["nebula"],
        img: "global/ui/tiles/base/hazard/tile_042.png",
    },
    {
        tile: 43,
        source: "base",
        anomalies: ["supernova"],
        img: "global/ui/tiles/base/hazard/tile_043.png",
    },
    {
        tile: 44,
        source: "base",
        anomalies: ["asteroid field"],
        img: "global/ui/tiles/base/hazard/tile_044.png",
    },
    {
        tile: 45,
        source: "base",
        anomalies: ["asteroid field"],
        img: "global/ui/tiles/base/hazard/tile_045.png",
    },
    {
        tile: 46,
        source: "base",
        img: "global/ui/tiles/base/hazard/tile_046.png",
    },
    {
        tile: 47,
        source: "base",
        img: "global/ui/tiles/base/hazard/tile_047.png",
    },
    {
        tile: 48,
        source: "base",
        img: "global/ui/tiles/base/hazard/tile_048.png",
    },
    {
        tile: 49,
        source: "base",
        img: "global/ui/tiles/base/hazard/tile_049.png",
    },
    {
        tile: 50,
        source: "base",
        img: "global/ui/tiles/base/hazard/tile_050.png",
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
        img: "locale/ui/tiles/base/special/tile_051.png",
    },

    // pok systems
    {
        tile: 52,
        source: "pok",
        home: true,
        planets: [{ localeName: "planet.ixth", resources: 3, influence: 5 }],
        img: "locale/ui/tiles/pok/homeworld/tile_052.png",
    },
    {
        tile: 53,
        source: "pok",
        home: true,
        planets: [
            { localeName: "planet.arcturus", resources: 4, influence: 4 },
        ],
        img: "locale/ui/tiles/pok/homeworld/tile_053.png",
    },
    {
        tile: 54,
        source: "pok",
        home: true,
        planets: [{ localeName: "planet.acheron", resources: 4, influence: 0 }],
        img: "locale/ui/tiles/pok/homeworld/tile_054.png",
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
        img: "locale/ui/tiles/pok/homeworld/tile_055.png",
    },
    {
        tile: 56,
        source: "pok",
        home: true,
        anomalies: ["nebula"],
        planets: [
            { localeName: "planet.the_dark", resources: 3, influence: 4 },
        ],
        img: "locale/ui/tiles/pok/homeworld/tile_056.png",
    },
    {
        tile: 57,
        source: "pok",
        home: true,
        planets: [
            { localeName: "planet.naazir", resources: 2, influence: 1 },
            { localeName: "planet.rokha", resources: 1, influence: 2 },
        ],
        img: "locale/ui/tiles/pok/homeworld/tile_057.png",
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
        img: "locale/ui/tiles/pok/homeworld/tile_058.png",
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
        img: "locale/ui/tiles/pok/regular/tile_059.png",
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
        img: "locale/ui/tiles/pok/regular/tile_060.png",
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
        img: "locale/ui/tiles/pok/regular/tile_061.png",
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
        img: "locale/ui/tiles/pok/regular/tile_062.png",
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
        img: "locale/ui/tiles/pok/regular/tile_063.png",
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
        img: "locale/ui/tiles/pok/regular/tile_064.png",
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
        img: "locale/ui/tiles/pok/regular/tile_065.png",
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
        img: "locale/ui/tiles/pok/regular/tile_066.png",
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
        img: "locale/ui/tiles/pok/hazard/tile_067.png",
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
        img: "locale/ui/tiles/pok/hazard/tile_068.png",
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
        img: "locale/ui/tiles/pok/regular/tile_069.png",
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
                trait: ["hazardous"],
            },
        ],
        img: "locale/ui/tiles/pok/regular/tile_070.png",
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
        img: "locale/ui/tiles/pok/regular/tile_071.png",
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
        img: "locale/ui/tiles/pok/regular/tile_072.png",
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
        img: "locale/ui/tiles/pok/regular/tile_073.png",
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
        img: "locale/ui/tiles/pok/regular/tile_074.png",
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
        img: "locale/ui/tiles/pok/regular/tile_075.png",
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
        img: "locale/ui/tiles/pok/regular/tile_076.png",
    },
    {
        tile: 77,
        source: "pok",
        img: "global/ui/tiles/pok/hazard/tile_077.png",
    },
    {
        tile: 78,
        source: "pok",
        img: "global/ui/tiles/pok/hazard/tile_078.png",
    },
    {
        tile: 79,
        source: "pok",
        anomalies: ["asteroid field"],
        wormholes: ["alpha"],
        img: "global/ui/tiles/pok/hazard/tile_079.png",
    },
    {
        tile: 80,
        source: "pok",
        anomalies: ["supernova"],
        img: "global/ui/tiles/pok/hazard/tile_080.png",
    },
    {
        tile: 81,
        source: "pok",
        anomalies: ["supernova"], // muaat hero supernova tile
        img: "global/ui/tiles/pok/special/tile_081.png",
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
                    "card.legendary_planet:pok/exterrix_headquarters",
                trait: ["cultural"],
                position: { x: 1.2, y: 1 },
            },
        ],
        img: "locale/ui/tiles/pok/special/tile_082.png",
    },
    {
        tile: 83,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [], [5], [], [], [2]],
        hyperlaneFaceDown: [[3, 4], [3], [], [0, 1], [0], []],
        img: "global/ui/tiles/pok/hyperlane/tile_083_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_083_r.png",
    },
    {
        tile: 84,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [4], [], [], [1], []],
        hyperlaneFaceDown: [[2, 3], [], [0], [0, 5], [], [3]],
        img: "global/ui/tiles/pok/hyperlane/tile_084_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_084_r.png",
    },
    {
        tile: 85,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [5], [], [], [], [1]],
        hyperlaneFaceDown: [[3, 4], [3], [], [0, 1], [0], []],
        img: "global/ui/tiles/pok/hyperlane/tile_085_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_085_r.png",
    },
    {
        tile: 86,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [5], [], [], [], [1]],
        hyperlaneFaceDown: [[2, 3], [], [0], [0, 5], [], [3]],
        img: "global/ui/tiles/pok/hyperlane/tile_086_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_086_r.png",
    },
    {
        tile: 87,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[4], [4], [4], [], [0, 1, 2], []],
        hyperlaneFaceDown: [[3, 4], [], [], [0], [0], []],
        img: "global/ui/tiles/pok/hyperlane/tile_087_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_087_r.png",
    },
    {
        tile: 88,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2], [], [0, 4, 5], [], [2], [2]],
        hyperlaneFaceDown: [[3, 4], [3], [], [0, 1], [0], []],
        img: "global/ui/tiles/pok/hyperlane/tile_088_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_088_r.png",
    },
    {
        tile: 89,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2, 4], [], [0, 4], [], [0, 2], []],
        hyperlaneFaceDown: [[2, 3], [], [0], [0], [], []],
        img: "global/ui/tiles/pok/hyperlane/tile_089_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_089_r.png",
    },
    {
        tile: 90,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[], [5], [4], [], [2], [1]],
        hyperlaneFaceDown: [[2, 3], [], [0], [0], [], []],
        img: "global/ui/tiles/pok/hyperlane/tile_090_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_090_r.png",
    },
    {
        tile: 91,
        source: "pok",
        hyperlane: true,
        hyperlaneFaceUp: [[2, 3], [], [0], [0, 5], [], [3]],
        hyperlaneFaceDown: [[3, 4], [], [], [0], [0], []],
        img: "global/ui/tiles/pok/hyperlane/tile_091_o.png",
        imgFaceDown: "global/ui/tiles/pok/hyperlane/tile_091_r.png",
    },

    // Planets without a system.
    {
        tile: -1,
        source: "codex.vigil",
        planets: [
            {
                localeName: "planet.custodia_vigilia",
                resources: 2,
                influence: 3,
                legendary: true,
                legendaryCard:
                    "card.legendary_planet:codex.vigil/custodia_vigilia",
            },
        ],
        img: "",
    },
];
