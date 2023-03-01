/**
 * Custom components:
 * - Starting units
 * - Starting tech
 * - Commodity tiles
 * - Flagships
 * - Faction abilities
 * - Base units
 *
 * Pulled from elsewhere:
 * - Promissory notes
 * - Faction tech
 * - Agents
 * - Commanders
 * - Heroes
 * - Mech
 * - Home systems
 * - Blue systems
 * - Red systems
 *
 * Non-draft parts
 */

const FRANKEN_DRAFT_CONFIG = {
    promissoryNotes: {
        default: 2,
        min: 1,
        available: 21,
        label: "Promissory Notes",
    },
    flagships: {
        default: 2,
        min: 1,
        available: 23,
        label: "Flagships",
    },
    factionTech: {
        default: 3,
        min: 1,
        available: 47,
        label: "Faction Tech",
    },
    agents: {
        default: 2,
        min: 1,
        available: 24,
        label: "Ldr: Agents",
    },
    commanders: {
        default: 2,
        min: 1,
        available: 23,
        label: "Ldr: Commanders",
    },
    heroes: {
        default: 2,
        min: 1,
        available: 26,
        label: "Ldr: Heroes",
    },
    mechs: {
        default: 2,
        min: 1,
        available: 20,
        label: "Mech",
    },
    homeSystems: {
        default: 2,
        min: 1,
        available: 24,
        label: "Systems: Home",
    },
    blueSystems: {
        default: 3,
        min: 1,
        available: 37,
        label: "Systems: Blue",
    },
    redSystems: {
        default: 2,
        min: 1,
        available: 18,
        label: "Systems: Red",
    },
    startingUnits: {
        default: 2,
        min: 1,
        available: 25,
        label: "Starting Units",
        tint: "#000000",
    },
    startingTech: {
        default: 2,
        min: 1,
        available: 21, // removed "choose X"
        label: "Starting Tech",
        tint: "#000000",
    },
    commodities: {
        default: 2,
        min: 1,
        available: 25,
        label: "Commodities",
        tint: "#000000",
    },
    factionAbilities: {
        default: 4,
        min: 1,
        available: 58,
        label: "Faction Abilities",
        tint: "#000000",
    },
    strategyCardPickOrder: {
        default: 1,
        min: 0,
        max: 1,
        label: "Strategy Card Pick #",
        tint: "#000000",
    },
};

module.exports = { FRANKEN_DRAFT_CONFIG };
