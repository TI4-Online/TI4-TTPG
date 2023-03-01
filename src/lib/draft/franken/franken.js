const assert = require("../../../wrapper/assert-wrapper");
const _ = require("lodash");
const { Broadcast } = require("../../broadcast");
const { FactionAbilitySchema } = require("./franken.schema");
const { FactionSchema } = require("../../faction/faction.schema");
const { ObjectNamespace } = require("../../object-namespace");
const { FACTION_ABILITIES } = require("./franken.data");
const {
    Card,
    Container,
    GameObject,
    Zone,
    ZonePermission,
    world,
} = require("../../../wrapper/api");
const { FrankenCreateSources } = require("./franken-create-sources");
const { FRANKEN_DRAFT_CONFIG } = require("./franken-draft-config");
const { FrankenUndraftable } = require("./franken-undraftable");

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

    // ------------------------------------------------------------------------

    constructor() {
        this._draftSettings = _.cloneDeep(FRANKEN_DRAFT_CONFIG);
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
            const bag = FrankenCreateSources._spawnContainer(pos, rot);
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
        const result = FrankenCreateSources.createAll();
        for (const item of Object.values(result)) {
            this._deleteOnCancel.push(item);
        }
        this._undraftableContainer = result.undraftable; // for post-draft fetching
        return result;
    }

    gainUndraftables() {
        FrankenUndraftable.spawnUndraftableItems(this._undraftableContainer);
        return true;
    }

    /**
     * Set up factions.
     */
    finishDraft() {
        console.log("MiltyDraft.finishDraft");

        this._gatherFactionDefinitions();
        this._fillFactionSheets();
        this._destroyExtras();

        return true;
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
