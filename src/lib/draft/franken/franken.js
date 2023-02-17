const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const _ = require("lodash");
const { ObjectNamespace } = require("../../object-namespace");
const { ReplaceObjects } = require("../../../setup/spawn/replace-objects");
const { Spawn } = require("../../../setup/spawn/spawn");
const { UnitAttrs } = require("../../unit/unit-attrs");
const {
    FACTION_ABILITIES,
    UNDRAFTABLE,
    REMOVE_CARDS,
} = require("./franken.data");
const {
    Card,
    Container,
    GameObject,
    Rotator,
    Vector,
    world,
} = require("../../../wrapper/api");
const { Technology } = require("../../technology/technology");

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

const DRAFT_SETTINGS = {
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
        available: 25,
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
};

class Franken {
    static abilityNameToNsidName(name) {
        return name
            .toLowerCase()
            .replace(/ +/g, "_")
            .replace(/[^\w\s_]/g, "");
    }
    /**
     * Get NSIDs for undraftable items.  These will be added (if appropriate)
     * after choosing components.
     */
    static getUndraftableNSIDs() {
        const undraftableNSIDs = new Set();
        for (const undraftable of UNDRAFTABLE) {
            undraftableNSIDs.add(undraftable.nsid);
        }
        for (const nsid of REMOVE_CARDS) {
            undraftableNSIDs.add(nsid);
        }
        return undraftableNSIDs;
    }

    static spawnContainer(pos, rot) {
        const nsid = "bag:base/generic";
        const container = Spawn.spawn(nsid, pos, rot);
        assert(container);
        container.setMaxItems(500);
        container.setTags(["DELETED_ITEMS_IGNORE"]);
        container.snapToGround();
        return container;
    }

    static spawnDeck(pos, rot, nsidPrefix, nsidPruner, undraftableContainer) {
        assert(typeof nsidPrefix === "string");
        assert(typeof nsidPruner === "function");
        assert(undraftableContainer instanceof Container);

        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            return parsedNsid.type.startsWith(nsidPrefix);
        });
        mergeDeckNsids.sort();

        // Spawn the decks, combine into one.
        let deck = false;
        mergeDeckNsids.forEach((mergeDeckNsid) => {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (deck) {
                mergeDeck.setTags(["DELETED_ITEMS_IGNORE"]);
                deck.addCards(mergeDeck);
            } else {
                deck = mergeDeck;
            }
        });

        // Apply replacement rules ("x.omega") AFTER game is set up.
        if (world.TI4.config.timestamp > 0) {
            ReplaceObjects.removeReplacedObjects([deck]);
        }

        // Remove any excluded cards.
        // Cards in a deck are not objects, pull them out.
        const undraftableNsids = Franken.getUndraftableNSIDs();
        const cardNsids = ObjectNamespace.getDeckNsids(deck);
        for (let i = cardNsids.length - 1; i >= 0; i--) {
            const cardNsid = cardNsids[i];
            const undraftable = undraftableNsids.has(cardNsid);
            const prune = nsidPruner(cardNsid);
            if (undraftable || prune) {
                let cardObj;
                if (deck.getStackSize() > 1) {
                    //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                    cardObj = deck.takeCards(1, true, i);
                } else {
                    cardObj = deck; // cannot take final card
                }
                assert(cardObj instanceof Card);

                if (undraftable) {
                    const index = 0;
                    const showAnimation = false;
                    undraftableContainer.addObjects(
                        [cardObj],
                        index,
                        showAnimation
                    );
                } else if (prune) {
                    cardObj.setTags(["DELETED_ITEMS_IGNORE"]);
                    cardObj.destroy();
                }
            }
        }

        return deck;
    }

    static createPromissoryNotesDeck(pos, rot, undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        const colors = new Set([
            "white",
            "blue",
            "purple",
            "yellow",
            "red",
            "green",
            "orange",
            "pink",
            "brown", // cards exist, but color not available
        ]);
        const nsidPruner = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const lastPart = parsed.type.split(".").pop();
            return colors.has(lastPart);
        };

        const deck = Franken.spawnDeck(
            pos,
            rot,
            "card.promissory",
            nsidPruner,
            undraftableContainer
        );
        deck.setName(DRAFT_SETTINGS.promissoryNotes.label);

        return deck;
    }

    static createFlagshipDeck(pos, rot, undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        const flagships = new Set();
        const flagshipToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.units) {
                const unitUpgrade = UnitAttrs.getNsidNameUnitUpgrade(nsidName);
                if (unitUpgrade.unit === "flagship") {
                    flagships.add(nsidName);
                    flagshipToFactionName[nsidName] = faction.nameFull;
                }
            }
        }

        const nsidPruner = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            if (flagships.has(name)) {
                flagships.delete(name);
                return false;
            }
            return true;
        };

        const deck = Franken.spawnDeck(
            pos,
            rot,
            "card.technology.unit_upgrade",
            nsidPruner,
            undraftableContainer
        );
        deck.setName(DRAFT_SETTINGS.flagships.label);

        if (flagships.size > 0) {
            console.log(
                `Franken.createFlagshipDeck: missing cards for |n|=${
                    flagships.size
                } : ${[...flagships]
                    .map(
                        (nsidName) =>
                            `${nsidName} (${flagshipToFactionName[nsidName]})`
                    )
                    .join(", ")}`
            );
        }

        return deck;
    }

    static createMechDeck(pos, rot, undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        const mechs = new Set();
        const mechToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.units) {
                const unitUpgrade = UnitAttrs.getNsidNameUnitUpgrade(nsidName);
                if (unitUpgrade.unit === "mech") {
                    mechs.add(nsidName);
                    mechToFactionName[nsidName] = faction.nameFull;
                }
            }
        }

        const nsidPruner = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            if (mechs.has(name)) {
                mechs.delete(name);
                return false;
            }
            return true;
        };

        const deck = Franken.spawnDeck(
            pos,
            rot,
            "card.leader",
            nsidPruner,
            undraftableContainer
        );
        deck.setName(DRAFT_SETTINGS.mechs.label);

        if (mechs.size > 0) {
            console.log(
                `Franken.createMechDeck: missing cards for |n|=${
                    mechs.size
                } : ${[...mechs]
                    .map(
                        (nsidName) =>
                            `${nsidName} (${mechToFactionName[nsidName]})`
                    )
                    .join(", ")}`
            );
        }

        return deck;
    }

    static createFactionTechDeck(pos, rot, undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        const tech = new Set();
        const techToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.techs) {
                tech.add(nsidName);
                techToFactionName[nsidName] = faction.nameFull;
            }
            for (const nsidName of faction.raw.units) {
                const unitUpgrade = UnitAttrs.getNsidNameUnitUpgrade(nsidName);
                if (unitUpgrade.raw.upgradeLevel !== 2) {
                    continue;
                }
                tech.add(nsidName);
                techToFactionName[nsidName] = faction.nameFull;
            }
        }

        const nsidPruner = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            if (tech.has(name)) {
                tech.delete(name);
                return false;
            }
            return true;
        };

        const deck = Franken.spawnDeck(
            pos,
            rot,
            "card.technology",
            nsidPruner,
            undraftableContainer
        );
        deck.setName(DRAFT_SETTINGS.factionTech.label);

        if (tech.size > 0) {
            console.log(
                `Franken.createFactionTechDeck: missing cards for |n|=${
                    tech.size
                } : ${[...tech]
                    .map(
                        (nsidName) =>
                            `${nsidName} (${techToFactionName[nsidName]})`
                    )
                    .join(", ")}`
            );
        }

        return deck;
    }

    static createLeaderDeck(leaderType, pos, rot, undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        const nsidPruner = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            const thisLeaderType = parsed.type.split(".")[2];
            return leaderType !== thisLeaderType;
        };

        const deck = Franken.spawnDeck(
            pos,
            rot,
            "card.leader",
            nsidPruner,
            undraftableContainer
        );
        if (leaderType === "agent") {
            deck.setName(DRAFT_SETTINGS.agents.label);
        } else if (leaderType === "commander") {
            deck.setName(DRAFT_SETTINGS.commanders.label);
        } else if (leaderType === "hero") {
            deck.setName(DRAFT_SETTINGS.heroes.label);
        } else {
            throw new Error(`bad type "${leaderType}"`);
        }
        return deck;
    }

    static createSystems(systemType, pos, rot) {
        assert(typeof systemType === "string");

        const container = Franken.spawnContainer(pos, rot);
        if (systemType === "home") {
            container.setName(DRAFT_SETTINGS.homeSystems.label);
        } else if (systemType === "blue") {
            container.setName(DRAFT_SETTINGS.blueSystems.label);
        } else if (systemType === "red") {
            container.setName(DRAFT_SETTINGS.redSystems.label);
        } else {
            throw new Error(`bad type "${systemType}"`);
        }

        const undraftableNsids = Franken.getUndraftableNSIDs();
        const above = pos.add([0, 0, 10]);

        for (const system of world.TI4.getAllSystems()) {
            if (systemType === "home" && !system.home) {
                continue;
            }
            if (systemType === "blue" && !system.blue) {
                continue;
            }
            if (systemType === "red" && !system.red) {
                continue;
            }
            const nsid = system.tileNsid;
            if (undraftableNsids.has(nsid)) {
                continue;
            }
            const tile = Spawn.spawn(nsid, above, rot);
            container.addObjects([tile]);
        }
        console.log(
            `Franken.createSystems: |${systemType}|=${
                container.getItems().length
            }`
        );
        return container;
    }

    static createFactionAbilities(pos, rot) {
        const container = Franken.spawnContainer(pos, rot);
        container.setName(DRAFT_SETTINGS.factionAbilities.label);

        const above = pos.add([0, 0, 10]);
        for (const ability of FACTION_ABILITIES) {
            const name = ability.name;
            const desc = ability.description;
            const json = JSON.stringify({ franken: true, ability });

            const nsid = "tile:homebrew/name_desc";
            const nameDescTile = Spawn.spawn(nsid, above, rot);
            nameDescTile.setName(name);
            nameDescTile.setDescription(desc);
            nameDescTile.setSavedData(json);
            container.addObjects([nameDescTile]);
        }

        return container;
    }

    static createCommodities(pos, rot) {
        const container = Franken.spawnContainer(pos, rot);
        container.setName(DRAFT_SETTINGS.commodities.label);

        const above = pos.add([0, 0, 10]);
        for (const faction of world.TI4.getAllFactions()) {
            const name = `Commodities ${faction.raw.commodities} (${faction.nameAbbr})`;
            const desc = `${faction.nameFull} commodities`;
            const json = JSON.stringify({
                franken: true,
                commodities: faction.raw.commodities,
            });

            const nsid = "tile:homebrew/name_desc";
            const nameDescTile = Spawn.spawn(nsid, above, rot);
            nameDescTile.setName(name);
            nameDescTile.setDescription(desc);
            nameDescTile.setSavedData(json);
            container.addObjects([nameDescTile]);
        }

        return container;
    }

    static createStartingUnits(pos, rot) {
        const container = Franken.spawnContainer(pos, rot);
        container.setName(DRAFT_SETTINGS.startingUnits.label);

        const above = pos.add([0, 0, 10]);
        for (const faction of world.TI4.getAllFactions()) {
            const name = `Fleet ${faction.nameAbbr}`;
            const desc = Object.entries(faction.raw.startingUnits)
                .map(([unit, count]) => {
                    unit = locale(`unit.${unit}`);
                    return `${count} ${unit}`;
                })
                .join("\n");
            const json = JSON.stringify({
                franken: true,
                startingUnits: faction.raw.startingUnits,
            });

            const nsid = "tile:homebrew/name_desc";
            const nameDescTile = Spawn.spawn(nsid, above, rot);
            nameDescTile.setName(name);
            nameDescTile.setDescription(desc);
            nameDescTile.setSavedData(json);

            container.addObjects([nameDescTile]);
        }

        return container;
    }

    static createStartingTech(pos, rot) {
        const container = Franken.spawnContainer(pos, rot);
        container.setName(DRAFT_SETTINGS.startingTech.label);

        const above = pos.add([0, 0, 10]);
        for (const faction of world.TI4.getAllFactions()) {
            const name = `Tech ${faction.nameAbbr}`;
            const desc = faction.raw.startingTech
                .map((tech) => {
                    const techData = Technology.getByNsidName(tech);
                    if (!techData) {
                        console.log(
                            `Franken.createStartingTech: unknown tech "${tech}"`
                        );
                        return tech;
                    }

                    let color = undefined;
                    if (techData.type === "Blue") {
                        color = "#3232ff";
                    } else if (techData.type === "Green") {
                        color = "#008000";
                    } else if (techData.type === "Yellow") {
                        color = "#e5e500";
                    } else if (techData.type === "Red") {
                        color = "#cc0000";
                    } else if (techData.type === "unitUpgrade") {
                        color = "#ffffff";
                    } else if (techData.type === "") {
                        color = "#ffffff"; // valefar assimilator x/y
                    } else {
                        console.log(
                            `Franken.createStartingTech: unknown type "${techData.type}"`
                        );
                        color = "#ffffff";
                    }
                    return `[color=${color}]${techData.name}[/color]`;
                })
                .join("\n");
            const json = JSON.stringify({
                franken: true,
                startingTech: faction.raw.startingTech,
            });

            const nsid = "tile:homebrew/name_desc";
            const nameDescTile = Spawn.spawn(nsid, above, rot);
            nameDescTile.setName(name);
            nameDescTile.setDescription(desc);
            nameDescTile.setSavedData(json);

            container.addObjects([nameDescTile]);
        }

        return container;
    }

    // ------------------------------------------------------------------------

    constructor() {
        this._draftSettings = _.cloneDeep(DRAFT_SETTINGS);
        this._deleteOnCancel = [];

        // Draft settings UI updates "_value" field.
        for (const entry of Object.values(this._draftSettings)) {
            entry._value = entry.default;
            entry.max = Math.floor(
                entry.available / world.TI4.config.playerCount
            );
            entry.min = Math.min(entry.min, entry.max);
        }
    }

    getDraftSettings() {
        return this._draftSettings;
    }

    startDraft() {
        console.log("Franken.startDraft");

        const values = {};
        for (const [key, entry] of Object.entries(this._draftSettings)) {
            values[key] = entry._value;
        }
        console.log(`Draft values: ${JSON.stringify(values)}`);

        let posStorage = new Vector(0, -62, world.getTableHeight() + 5);
        const nextPos = () => {
            posStorage.y = posStorage.y + 12;
            if (posStorage.y > 50) {
                posStorage.y = -50;
                posStorage.x = posStorage.x - 12;
            }
            return posStorage.clone();
        };

        let pos = nextPos();
        const rot = new Rotator(0, 0, 0);
        const undraftableContainer = Franken.spawnContainer(pos, rot);
        undraftableContainer.setName("Undraftable");
        this._deleteOnCancel.push(undraftableContainer);

        pos = nextPos();
        let deck = Franken.createPromissoryNotesDeck(
            pos,
            rot,
            undraftableContainer
        );
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createFlagshipDeck(pos, rot, undraftableContainer);
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createFactionTechDeck(pos, rot, undraftableContainer);
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createLeaderDeck(
            "agent",
            pos,
            rot,
            undraftableContainer
        );
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createLeaderDeck(
            "commander",
            pos,
            rot,
            undraftableContainer
        );
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createLeaderDeck("hero", pos, rot, undraftableContainer);
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        deck = Franken.createMechDeck(pos, rot, undraftableContainer);
        this._deleteOnCancel.push(deck);

        pos = nextPos();
        const homeSystemsContainer = Franken.createSystems("home", pos, rot);
        this._deleteOnCancel.push(homeSystemsContainer);

        pos = nextPos();
        const blueSystemsContainer = Franken.createSystems("blue", pos, rot);
        this._deleteOnCancel.push(blueSystemsContainer);

        pos = nextPos();
        const redSystemsContainer = Franken.createSystems("red", pos, rot);
        this._deleteOnCancel.push(redSystemsContainer);

        pos = nextPos();
        const factionAbilitiesContainer = Franken.createFactionAbilities(
            pos,
            rot
        );
        this._deleteOnCancel.push(factionAbilitiesContainer);

        pos = nextPos();
        const commoditiesContainer = Franken.createCommodities(pos, rot);
        this._deleteOnCancel.push(commoditiesContainer);

        pos = nextPos();
        const startingUnitsContainer = Franken.createStartingUnits(pos, rot);
        this._deleteOnCancel.push(startingUnitsContainer);

        pos = nextPos();
        const startingTechContainer = Franken.createStartingTech(pos, rot);
        this._deleteOnCancel.push(startingTechContainer);
    }

    cancel() {
        console.log("Franken.cancel");

        for (const obj of this._deleteOnCancel) {
            assert(obj instanceof GameObject);
            if (obj.isValid()) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                if (obj instanceof Container) {
                    obj.clear();
                }
                obj.destroy();
            }
        }
        this._deleteOnCancel = [];
    }
}

module.exports = { Franken };
