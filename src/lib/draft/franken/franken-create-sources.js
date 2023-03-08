const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { FrankenUndraftable } = require("./franken-undraftable");
const { ObjectNamespace } = require("../../object-namespace");
const { PlayerDeskColor } = require("../../player-desk/player-desk-color");
const { ReplaceObjects } = require("../../../setup/spawn/replace-objects");
const { Spawn } = require("../../../setup/spawn/spawn");
const { Technology } = require("../../technology/technology");
const {
    FACTION_ABILITIES,
    MERGE_ABILITIES,
    REMOVE_CARDS,
} = require("./franken.data");
const { FRANKEN_DRAFT_CONFIG } = require("./franken-draft-config");
const {
    Card,
    Container,
    Rotator,
    Vector,
    world,
} = require("../../../wrapper/api");

function _abilityNameToNsidName(name) {
    return name
        .toLowerCase()
        .replace(/ +/g, "_")
        .replace(/[^\w\s_]/g, "");
}

/**
 * Create source decks and containers for assembling per-player draft choices.
 */
class FrankenCreateSources {
    static _spawnContainer(pos, rot) {
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

    static _spawnDeck(pos, rot, nsidPrefix, nsidPruner, undraftableContainer) {
        assert(typeof nsidPrefix === "string");
        assert(typeof nsidPruner === "function");
        assert(undraftableContainer instanceof Container);

        const exclude = new Set(REMOVE_CARDS);

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
        const undraftableNsids = FrankenUndraftable.getUndraftableNSIDs();
        const cardNsids = ObjectNamespace.getDeckNsids(deck);
        for (let i = cardNsids.length - 1; i >= 0; i--) {
            const cardNsid = cardNsids[i];
            const isUndraftable = undraftableNsids.has(cardNsid);
            const prune = nsidPruner(cardNsid) || exclude.has(cardNsid);
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

        const deck = FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.promissory",
            nsidPruner,
            undraftable
        );
        deck.setName(FRANKEN_DRAFT_CONFIG.promissoryNotes.label);

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

        const deck = FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.technology.unit_upgrade",
            nsidPruner,
            undraftable
        );
        deck.setName(FRANKEN_DRAFT_CONFIG.flagships.label);

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

        const deck = FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.leader",
            nsidPruner,
            undraftable
        );
        deck.setName(FRANKEN_DRAFT_CONFIG.mechs.label);

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

        const deck = FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.technology",
            nsidPruner,
            undraftable
        );
        deck.setName(FRANKEN_DRAFT_CONFIG.factionTech.label);

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

        const deck = FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.leader",
            nsidPruner,
            undraftable
        );
        if (leaderType === "agent") {
            deck.setName(FRANKEN_DRAFT_CONFIG.agents.label);
        } else if (leaderType === "commander") {
            deck.setName(FRANKEN_DRAFT_CONFIG.commanders.label);
        } else if (leaderType === "hero") {
            deck.setName(FRANKEN_DRAFT_CONFIG.heroes.label);
        } else {
            throw new Error(`bad type "${leaderType}"`);
        }
        return deck;
    }

    static createAllianceCards(undraftable) {
        assert(undraftable instanceof Container);

        const pos = undraftable.getPosition().add([0, 0, 10]);
        const rot = undraftable.getRotation();
        FrankenCreateSources._spawnDeck(
            pos,
            rot,
            "card.alliance",
            () => {
                return true;
            },
            undraftable
        );
    }

    static createSystems(systemType, pos, rot) {
        assert(typeof systemType === "string");

        const container = FrankenCreateSources._spawnContainer(pos, rot);
        if (systemType === "home") {
            container.setName(FRANKEN_DRAFT_CONFIG.homeSystems.label);
        } else if (systemType === "blue") {
            container.setName(FRANKEN_DRAFT_CONFIG.blueSystems.label);
        } else if (systemType === "red") {
            container.setName(FRANKEN_DRAFT_CONFIG.redSystems.label);
        } else {
            throw new Error(`bad type "${systemType}"`);
        }

        const undraftableNsids = FrankenUndraftable.getUndraftableNSIDs();
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
        const container = FrankenCreateSources._spawnContainer(pos, rot);
        container.setName(FRANKEN_DRAFT_CONFIG.factionAbilities.label);

        // Build merged abilities information.
        const abilityNameToAbility = {};
        for (const ability of FACTION_ABILITIES) {
            abilityNameToAbility[ability.name] = ability;
        }
        const suppressSet = new Set();
        for (const abilityNames of Object.values(MERGE_ABILITIES)) {
            for (const abilityName of abilityNames) {
                assert(abilityNameToAbility);
                suppressSet.add(abilityName);
            }
        }

        const above = pos.add([0, 0, 10]);
        for (const ability of FACTION_ABILITIES) {
            let name = ability.name;
            let desc = ability.description;
            const abilities = [_abilityNameToNsidName(ability.name)];

            // Suppress linked abilities.
            if (suppressSet.has(name)) {
                console.log(`suppress "${name}"`);
                continue;
            }

            // Add linked abilities if this is the trigger.
            const mergeAbiltiyNames = MERGE_ABILITIES[name];
            if (mergeAbiltiyNames) {
                for (const mergeAbiltiyName of mergeAbiltiyNames) {
                    console.log(`merge "${mergeAbiltiyName}"`);
                    abilities.push(_abilityNameToNsidName(mergeAbiltiyName));

                    // Add text.
                    const mergeAbility = abilityNameToAbility[mergeAbiltiyName];
                    assert(mergeAbility);
                    desc =
                        desc +
                        `\n\n${mergeAbility.name.toUpperCase()}\n${
                            mergeAbility.description
                        }`;
                }
            }

            const json = JSON.stringify({
                franken: true,
                abilities,
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
        const container = FrankenCreateSources._spawnContainer(pos, rot);
        container.setName(FRANKEN_DRAFT_CONFIG.commodities.label);

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
        const container = FrankenCreateSources._spawnContainer(pos, rot);
        container.setName(FRANKEN_DRAFT_CONFIG.startingUnits.label);

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
        const container = FrankenCreateSources._spawnContainer(pos, rot);
        container.setName(FRANKEN_DRAFT_CONFIG.startingTech.label);

        const above = pos.add([0, 0, 10]);
        for (const faction of world.TI4.getAllFactions()) {
            // Skip factions with no starting tech (includes tech choice).
            if (faction.raw.startingTech.length === 0) {
                continue;
            }
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
        const container = FrankenCreateSources._spawnContainer(pos, rot);
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

    static createAll() {
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
        const undraftable = FrankenCreateSources._spawnContainer(pos, rot);
        undraftable.setName("Undraftable");

        const result = { undraftable };

        FrankenCreateSources.createAllianceCards(undraftable);

        pos = nextPos();
        result.promissoryNotes = FrankenCreateSources.createPromissoryNotesDeck(
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.flagships = FrankenCreateSources.createFlagshipDeck(
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.factionTech = FrankenCreateSources.createFactionTechDeck(
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.agents = FrankenCreateSources.createLeaderDeck(
            "agent",
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.commanders = FrankenCreateSources.createLeaderDeck(
            "commander",
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.heroes = FrankenCreateSources.createLeaderDeck(
            "hero",
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.mechs = FrankenCreateSources.createMechDeck(
            pos,
            rot,
            undraftable
        );

        pos = nextPos();
        result.homeSystems = FrankenCreateSources.createSystems(
            "home",
            pos,
            rot
        );

        pos = nextPos();
        result.blueSystems = FrankenCreateSources.createSystems(
            "blue",
            pos,
            rot
        );

        pos = nextPos();
        result.redSystems = FrankenCreateSources.createSystems("red", pos, rot);

        pos = nextPos();
        result.factionAbilities = FrankenCreateSources.createFactionAbilities(
            pos,
            rot
        );

        pos = nextPos();
        result.commodities = FrankenCreateSources.createCommodities(pos, rot);

        pos = nextPos();
        result.startingUnits = FrankenCreateSources.createStartingUnits(
            pos,
            rot
        );

        pos = nextPos();
        result.startingTech = FrankenCreateSources.createStartingTech(pos, rot);

        pos = nextPos();
        result.strategyCardPickOrder =
            FrankenCreateSources.createStrategyCardPickOrder(pos, rot);

        return result;
    }
}

module.exports = { FrankenCreateSources, _abilityNameToNsidName };
