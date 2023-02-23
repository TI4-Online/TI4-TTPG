const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const _ = require("lodash");
const { Broadcast } = require("../../broadcast");
const { FactionAbilitySchema } = require("./franken.schema");
const { FactionSchema } = require("../../faction/faction.schema");
const { ObjectNamespace } = require("../../object-namespace");
const { PlayerDeskColor } = require("../../player-desk/player-desk-color");
const { ReplaceObjects } = require("../../../setup/spawn/replace-objects");
const { Spawn } = require("../../../setup/spawn/spawn");
const { Technology } = require("../../technology/technology");
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
    Zone,
    ZonePermission,
    world,
} = require("../../../wrapper/api");

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
    strategyCardPickOrder: {
        default: 1,
        min: 0,
        max: 1,
        label: "Strategy Card Pick #",
        tint: "#000000",
    },
};

class Franken {
    static destroyLingeringDraftZones() {
        for (const zone of world.getAllZones()) {
            const savedData = zone.getSavedData() || "";
            if (savedData.startsWith("__Franken__")) {
                zone.destroy();
            }
        }
    }

    static injectFactionAbility(entry) {
        const err = FactionAbilitySchema.validate(entry);
        if (err) {
            throw new Error(
                `Franken.injectFactionAbility error ${JSON.stringify(err)}`
            );
        }
        FACTION_ABILITIES.push(entry);
    }

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
        const above = pos.add([0, 0, 10]); // snap to ground later
        const container = Spawn.spawn(nsid, above, rot);
        assert(container);
        assert(container instanceof Container);
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
            const isUndraftable = undraftableNsids.has(cardNsid);
            const prune = nsidPruner(cardNsid);
            if (isUndraftable || prune) {
                let cardObj;
                if (deck.getStackSize() > 1) {
                    //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                    cardObj = deck.takeCards(1, true, i);
                } else {
                    cardObj = deck; // cannot take final card
                }
                assert(cardObj instanceof Card);

                if (isUndraftable) {
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

    static createPromissoryNotesDeck(pos, rot, undraftable) {
        assert(undraftable instanceof Container);

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
            undraftable
        );
        deck.setName(DRAFT_SETTINGS.promissoryNotes.label);

        return deck;
    }

    static createFlagshipDeck(pos, rot, undraftable) {
        assert(undraftable instanceof Container);

        const flagships = new Set();
        const flagshipToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.units) {
                const unitUpgrade =
                    world.TI4.UnitAttrs.getNsidNameUnitUpgrade(nsidName);
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
            undraftable
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

    static createMechDeck(pos, rot, undraftable) {
        assert(undraftable instanceof Container);

        const mechs = new Set();
        const mechToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.units) {
                const unitUpgrade =
                    world.TI4.UnitAttrs.getNsidNameUnitUpgrade(nsidName);
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
            undraftable
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

    static createFactionTechDeck(pos, rot, undraftable) {
        assert(undraftable instanceof Container);

        const tech = new Set();
        const techToFactionName = {};
        for (const faction of world.TI4.getAllFactions()) {
            for (const nsidName of faction.raw.techs) {
                tech.add(nsidName);
                techToFactionName[nsidName] = faction.nameFull;
            }
            for (const nsidName of faction.raw.units) {
                const unitUpgrade =
                    world.TI4.UnitAttrs.getNsidNameUnitUpgrade(nsidName);
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
            undraftable
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

    static createLeaderDeck(leaderType, pos, rot, undraftable) {
        assert(undraftable instanceof Container);

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
            undraftable
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
            const json = JSON.stringify({
                franken: true,
                abilities: [Franken.abilityNameToNsidName(ability.name)],
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

                    let color = "#ffffff";
                    const type = techData.type.toLowerCase();
                    if (
                        type === "blue" ||
                        type === "green" ||
                        type === "yellow" ||
                        type === "red"
                    ) {
                        const attrs = PlayerDeskColor.getColorAttrs(type);
                        color = attrs.widgetHexColor;
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

    static createStrategyCardPickOrder(pos, rot) {
        const container = Franken.spawnContainer(pos, rot);
        container.setName("Strategy Card Pick Order");

        const above = pos.add([0, 0, 10]);
        for (let i = 0; i < world.TI4.config.playerCount; i++) {
            const name = `Strategy Pick ${i + 1}/${
                world.TI4.config.playerCount
            }`;
            const desc =
                "Player order for picking strategy cards at game start";
            const json = JSON.stringify({
                franken: true,
                turnOrder: i,
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
        this._draftZones = [];

        // Draft settings UI updates "_value" field.
        for (const entry of Object.values(this._draftSettings)) {
            entry._value = entry.default;
            if (!entry.max && entry.available) {
                entry.max = Math.floor(
                    entry.available / world.TI4.config.playerCount
                );
            }
            entry.min = Math.min(entry.min, entry.max);
        }
    }

    getDraftSettings() {
        return this._draftSettings;
    }

    startDraft() {
        console.log("Franken.startDraft");

        // Make sure no desk has a faction.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            if (faction) {
                Broadcast.chatAll(
                    "Cannot start Franken draft when a player already has a faction",
                    Broadcast.ERROR
                );
                return false;
            }
        }

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(true);
        }

        this._sources = this._createSources();

        return true;
    }

    createAndFillDraftBoxes() {
        const values = {};
        for (const [key, entry] of Object.entries(this._draftSettings)) {
            values[key] = entry._value;
        }
        console.log(`Draft values: ${JSON.stringify(values)}`);

        this._createDraftZones();
        const draftBags = this._createDraftBags();
        const sources = this._sources;

        for (const [key, settings] of Object.entries(this._draftSettings)) {
            const source = sources[key];
            const count = settings._value;
            console.log(`Franken.startDraft: dealing ${key} x${count}`);
            assert(source instanceof Card || source instanceof Container);
            assert(typeof count === "number");

            let getItem = undefined;
            if (source instanceof Card) {
                getItem = () => {
                    const stackSize = source.getStackSize();
                    if (stackSize === 0) {
                        Broadcast.chatAll(
                            `Ran out of "${key}"`,
                            Broadcast.ERROR
                        );
                        return undefined;
                    }
                    const numCards = 1;
                    const fromFront = true;
                    const offset = Math.floor(stackSize * Math.random());
                    return source.takeCards(numCards, fromFront, offset);
                };
            } else if (source instanceof Container) {
                getItem = () => {
                    if (source.getNumItems() === 0) {
                        Broadcast.chatAll(
                            `Ran out of "${key}"`,
                            Broadcast.ERROR
                        );
                        return undefined;
                    }
                    const index = Math.floor(
                        source.getNumItems() * Math.random()
                    );
                    const pos = source.getPosition().add([0, 0, 15]);
                    const showAnimation = false;
                    return source.takeAt(index, pos, showAnimation);
                };
            }

            for (const draftBag of draftBags) {
                for (let i = 0; i < count; i++) {
                    const item = getItem();
                    if (item) {
                        draftBag.addObjects([item]);
                    }
                }
            }
        }

        return true;
    }

    _createDraftBags() {
        return world.TI4.getAllPlayerDesks().map((playerDesk) => {
            const pos = playerDesk.center;
            const rot = playerDesk.rot;
            const bag = Franken.spawnContainer(pos, rot);
            bag.setPrimaryColor(playerDesk.plasticColor);
            bag.setName(`Franken Components (${playerDesk.colorName})`);
            this._deleteOnCancel.push(bag);
            return bag;
        });
    }

    _createDraftZones() {
        const zoneHeight = 21; // max hold height is 20
        const zoneScale = [60, 70, zoneHeight];
        const colorAlpha = 0.1;

        return world.TI4.getAllPlayerDesks().map((playerDesk) => {
            const pos = playerDesk.center.add([0, 0, zoneHeight / 2 - 0.1]);
            const rot = playerDesk.rot;
            const color = playerDesk.color.clone();
            color.a = colorAlpha;
            const zone = world.createZone(pos);
            zone.setAlwaysVisible(true);
            zone.setColor(color);
            zone.setInserting(ZonePermission.OwnersOnly);
            zone.setObjectInteraction(ZonePermission.OwnersOnly);
            zone.setObjectVisibility(ZonePermission.OwnersOnly);
            zone.setRotation(rot);
            zone.setSavedData(`__Franken__${playerDesk.index}`);
            zone.setScale(zoneScale);
            zone.setSlotOwns(playerDesk.playerSlot, true);
            zone.setSnapping(ZonePermission.OwnersOnly);
            zone.setStacking(ZonePermission.OwnersOnly);
            this._draftZones.push(zone);
            return zone;
        });
    }

    _createSources() {
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
        const undraftable = Franken.spawnContainer(pos, rot);
        undraftable.setName("Undraftable");
        this._deleteOnCancel.push(undraftable);

        const result = { undraftable };

        // Also keep a handle for pulling items post-draft.
        this._undraftableContainer = undraftable;

        pos = nextPos();
        result.promissoryNotes = Franken.createPromissoryNotesDeck(
            pos,
            rot,
            undraftable
        );
        this._deleteOnCancel.push(result.promissoryNotes);

        pos = nextPos();
        result.flagships = Franken.createFlagshipDeck(pos, rot, undraftable);
        this._deleteOnCancel.push(result.flagships);

        pos = nextPos();
        result.factionTech = Franken.createFactionTechDeck(
            pos,
            rot,
            undraftable
        );
        this._deleteOnCancel.push(result.factionTech);

        pos = nextPos();
        result.agents = Franken.createLeaderDeck(
            "agent",
            pos,
            rot,
            undraftable
        );
        this._deleteOnCancel.push(result.agents);

        pos = nextPos();
        result.commanders = Franken.createLeaderDeck(
            "commander",
            pos,
            rot,
            undraftable
        );
        this._deleteOnCancel.push(result.commanders);

        pos = nextPos();
        result.heroes = Franken.createLeaderDeck("hero", pos, rot, undraftable);
        this._deleteOnCancel.push(result.heroes);

        pos = nextPos();
        result.mechs = Franken.createMechDeck(pos, rot, undraftable);
        this._deleteOnCancel.push(result.mechs);

        pos = nextPos();
        result.homeSystems = Franken.createSystems("home", pos, rot);
        this._deleteOnCancel.push(result.homeSystems);

        pos = nextPos();
        result.blueSystems = Franken.createSystems("blue", pos, rot);
        this._deleteOnCancel.push(result.blueSystems);

        pos = nextPos();
        result.redSystems = Franken.createSystems("red", pos, rot);
        this._deleteOnCancel.push(result.redSystems);

        pos = nextPos();
        result.factionAbilities = Franken.createFactionAbilities(pos, rot);
        this._deleteOnCancel.push(result.factionAbilities);

        pos = nextPos();
        result.commodities = Franken.createCommodities(pos, rot);
        this._deleteOnCancel.push(result.commodities);

        pos = nextPos();
        result.startingUnits = Franken.createStartingUnits(pos, rot);
        this._deleteOnCancel.push(result.startingUnits);

        pos = nextPos();
        result.startingTech = Franken.createStartingTech(pos, rot);
        this._deleteOnCancel.push(result.startingTech);

        pos = nextPos();
        result.strategyCardPickOrder = Franken.createStrategyCardPickOrder(
            pos,
            rot
        );
        this._deleteOnCancel.push(result.strategyCardPickOrder);

        return result;
    }

    /**
     * Set up factions.
     */
    finishDraft() {
        console.log("MiltyDraft.finishDraft");

        this._gatherFactionDefinitions();
        this._fillFactionSheets();
        this._getUndraftableItems();
        this._destroyExtras();
    }

    _getUndraftableItems() {
        // Build map from trigger to undraftable entry.
        const abilityToEntry = {};
        const nsidToEntry = {};
        for (const undraftable of UNDRAFTABLE) {
            if (undraftable.triggerAbility) {
                abilityToEntry[undraftable.triggerAbility] = undraftable;
            }
            if (undraftable.triggerNsid) {
                nsidToEntry[undraftable.triggerNsid] = undraftable;
            }
            if (undraftable.triggerNsids) {
                for (const nsid of undraftable.triggerNsids) {
                    nsidToEntry[nsid] = undraftable;
                }
            }
        }

        // Look for triggers, build map from undraftable item nsid to { desk, count }.
        const undraftableNsidToDestination = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            const json =
                nsid === "tile:homebrew/name_desc"
                    ? JSON.parse(obj.getSavedData())
                    : undefined;

            const addUndraftable = (triggerObj, undraftable) => {
                assert(triggerObj instanceof GameObject);
                const pos = triggerObj.getPosition();
                const desk = world.TI4.getClosestPlayerDesk(pos);
                const undraftableNSID = undraftable.nsid;
                undraftableNsidToDestination[undraftableNSID] = {
                    desk,
                    count: undraftable.count,
                };
            };

            const undraftable = nsidToEntry[nsid];
            if (undraftable) {
                addUndraftable(obj, undraftable);
            }

            // Look into the object for faction abilities.
            if (json && json.abilities) {
                for (const ability of json.abilities) {
                    const undraftable = abilityToEntry[ability];
                    if (undraftable) {
                        addUndraftable(obj, undraftable);
                    }
                }
            }
        }

        // Add undraftables from container.
        for (const obj of this._undraftableContainer.getItems()) {
            const nsid = ObjectNamespace.getNsid(obj);
            const dst = undraftableNsidToDestination[nsid];
            if (!dst || dst.count <= 0) {
                continue;
            }
            dst.count -= 1;

            // Should this have a better position?
            const pos = dst.desk.center.add([0, 0, 10]);
            const success = this._undraftableContainer.take(obj, pos);
            assert(success);
            obj.snapToGround();
        }

        // Spawn any remaining undraftables.
        for (const [nsid, dst] of Object.entries(
            undraftableNsidToDestination
        )) {
            if (dst.count <= 0) {
                continue;
            }
            const pos = dst.desk.center.add([0, 0, 10]);
            const rot = dst.desk.rot;
            const obj = Spawn.spawn(nsid, pos, rot);
            assert(obj);
            obj.snapToGround();
        }
    }

    _gatherFactionDefinitions() {
        const deskIndexStrToPlayerName = {};
        const deskIndexStrToFaction = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            deskIndexStrToPlayerName[playerDesk.index] =
                world.TI4.getNameByPlayerSlot(playerDesk.playerSlot);
            deskIndexStrToFaction[playerDesk.index] = {
                abilities: [],
                commodities: 0,
                home: -1,
                icon: undefined,
                leaders: {
                    agents: [],
                    commanders: [],
                    heroes: [],
                },
                promissoryNotes: [],
                source: "franken",
                startingTech: [],
                startingUnits: {},
                techs: [],
                units: [],
                unpackExtra: [],
            };
        }

        const getFaction = (obj) => {
            assert(obj instanceof GameObject);
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            const faction = deskIndexStrToFaction[closestDesk.index];
            assert(faction);
            return faction;
        };

        const genericNoteColors = new Set([
            "white",
            "blue",
            "purple",
            "yellow",
            "red",
            "green",
            "pink",
            "orange",
            "brown",
        ]);
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid) {
                continue;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!parsed) {
                continue;
            }
            const parsedName = parsed.name.split(".")[0]; // remove .omega, etc
            const json =
                nsid === "tile:homebrew/name_desc"
                    ? JSON.parse(obj.getSavedData())
                    : undefined;

            if (json && json.abilities) {
                const faction = getFaction(obj);
                faction.abilities.push(...json.abilities);
            }

            if (json && json.commodities) {
                const faction = getFaction(obj);
                faction.commodities = json.commodities;
            }

            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system && system.home) {
                const faction = getFaction(obj);
                faction.home = system.tile;
            }

            if (nsid.startsWith("card.leader")) {
                const faction = getFaction(obj);
                const leaderType = parsed.type.split(".")[2];
                const leaderName = parsedName;
                if (leaderType === "agent") {
                    faction.leaders.agents.push(leaderName);
                } else if (leaderType === "commander") {
                    faction.leaders.commanders.push(leaderName);
                } else if (leaderType === "hero") {
                    faction.leaders.heroes.push(leaderName);
                } else if (leaderType === "mech") {
                    faction.units.push(leaderName);
                } else {
                    throw new Error(
                        `unknown leader type "${leaderType}" ("${leaderName}")`
                    );
                }
            }

            if (nsid.startsWith("card.promissory")) {
                const noteFactionNsidName = parsed.type.split(".")[2];
                if (!genericNoteColors.has(noteFactionNsidName)) {
                    const faction = getFaction(obj);
                    const noteName = parsedName;
                    const noteFaction =
                        world.TI4.getFactionByNsidName(noteFactionNsidName);
                    if (!noteFaction) {
                        throw new Error(`unknown note faction from "${nsid}"`);
                    }
                    faction.faction = noteFaction.nsidName; // use promissory note for faction id
                    faction.icon = noteFaction.icon;
                    faction.packageId = noteFaction.packageId;
                    faction.promissoryNotes.push(noteName);
                }
            }

            if (json && json.startingTech) {
                const faction = getFaction(obj);
                faction.startingTech = json.startingTech;
            }

            if (json && json.startingUnits) {
                const faction = getFaction(obj);
                faction.startingUnits = json.startingUnits;
            }

            if (nsid.startsWith("card.technology")) {
                const faction = getFaction(obj);
                const techName = parsedName;
                faction.techs.push(techName);
            }

            // Flagship uses a special franken card.
            if (
                nsid.startsWith("card.technology.unit_upgrade") &&
                parsed.source.startsWith("franken")
            ) {
                const faction = getFaction(obj);
                const techName = parsedName;
                faction.units.push(techName);
            }

            // Find other level-1 units if level-2 card.  Assume any
            // unit upgrade ending with "_2" has a corresponding level
            // one without that suffix (empty, not "_1").
            if (
                nsid.startsWith("card.technology.unit_upgrade") &&
                parsedName.endsWith("_2")
            ) {
                const faction = getFaction(obj);
                const unit_2 = parsedName;
                const unit_1 = unit_2.slice(0, -2);
                faction.units.push(unit_1);
                faction.units.push(unit_2);
            }
        }

        const errors = [];
        for (const [deskIndexStr, faction] of Object.entries(
            deskIndexStrToFaction
        )) {
            const onError = (err) => {
                const playerName = deskIndexStrToPlayerName[deskIndexStr];
                const msg = `Faction error for ${playerName}: ${
                    err.message
                } (${JSON.stringify(err)})`;
                errors.push(msg);
            };
            FactionSchema.validate(faction, onError);
        }

        if (errors.length > 0) {
            Broadcast.chatAll(errors.join("\n"), Broadcast.ERROR);
        }
    }

    _fillFactionSheets() {
        // XXX TODO
    }

    _destroyExtras() {
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

        for (const zone of this._draftZones) {
            assert(zone instanceof Zone);
            if (zone.isValid()) {
                zone.destroy();
            }
        }
        this._draftZones = [];
    }

    cancel() {
        console.log("Franken.cancel");

        this._destroyExtras();

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }
    }
}

Franken.destroyLingeringDraftZones();

module.exports = { Franken };
