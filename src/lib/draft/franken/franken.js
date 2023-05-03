const assert = require("../../../wrapper/assert-wrapper");
const _ = require("lodash");
const { Broadcast } = require("../../broadcast");
const { FactionAbilitySchema, UndraftableSchema } = require("./franken.schema");
const {
    FACTION_ABILITIES,
    MERGE_ABILITIES,
    UNDRAFTABLE,
} = require("./franken.data");
const { FrankenCreateSources } = require("./franken-create-sources");
const { FRANKEN_DRAFT_CONFIG } = require("./franken-draft-config");
const { FrankenUndraftable } = require("./franken-undraftable");
const { FrankenGenerateFaction } = require("./franken-generate-faction");
const {
    SetupFactionTokens,
} = require("../../../setup/faction/setup-faction-tokens");
const {
    SetupStartingTech,
} = require("../../../setup/faction/setup-starting-tech");
const {
    SetupStartingUnits,
} = require("../../../setup/faction/setup-starting-units");
const { Spawn } = require("../../../setup/spawn/spawn");
const {
    Card,
    Container,
    GameObject,
    ObjectType,
    Vector,
    Zone,
    ZonePermission,
    globalEvents,
    world,
} = require("../../../wrapper/api");
const { FrankenFinalize } = require("./franken-finalize");
const { ObjectNamespace } = require("../../object-namespace");
const { SetupHomeSystem } = require("../../../setup/faction/setup-home-system");

class Franken {
    static isDraftInProgress() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "bag:base/generic") {
                continue;
            }
            const name = obj.getName();
            if (name !== "Undraftable") {
                continue;
            }
            console.log("Franken.isDraftInProgress: true");
            return true;
        }

        return false;
    }

    static destroyLingeringDraftZones() {
        for (const zone of world.getAllZones()) {
            const savedData = zone.getSavedData() || "";
            if (savedData.startsWith("__Franken__")) {
                zone.destroy();
            }
        }
    }

    static injectFactionAbility(entry) {
        FactionAbilitySchema.validate(entry, (err) => {
            throw new Error(
                `Franken.injectFactionAbility error ${JSON.stringify(err)}`
            );
        });
        FACTION_ABILITIES.push(entry);

        if (entry.mergeAbility) {
            if (!MERGE_ABILITIES[entry.mergeAbility]) {
                MERGE_ABILITIES[entry.mergeAbility] = [];
            }
            MERGE_ABILITIES[entry.mergeAbility].push(entry.name);
        }
        if (entry.undraftable) {
            for (const item of entry.undraftable) {
                UNDRAFTABLE.push(item);
            }
        }
    }

    static injectUndraftable(entry) {
        UndraftableSchema.validate(entry, (err) => {
            throw new Error(
                `Franken.injectFactionAbility error ${JSON.stringify(err)}`
            );
        });
        UNDRAFTABLE.push(entry);
    }

    // ------------------------------------------------------------------------

    constructor() {
        this._draftSettings = _.cloneDeep(FRANKEN_DRAFT_CONFIG);
        this._deleteOnCancel = [];
        this._draftZones = [];
        this._factionSheets = [];
        this._sources = [];

        // In the event of a script reload find existing items and re-create zones.
        if (Franken.isDraftInProgress()) {
            this.resumeDraft();
        }

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

        this._factionSheets = this._createFactionSheets();
        this._sources = this._createSources();

        // If reloading scripts, recreate sources.
        const keyToId = {};
        for (const [key, obj] of Object.entries(this._sources)) {
            const id = obj.getId();
            keyToId[key] = id;
        }
        const json = JSON.stringify(keyToId);
        this._undraftableContainer.setSavedData(json);

        return true;
    }

    // If a player rewinds time all scripts get reset.
    resumeDraft() {
        console.log("Franken.resumeDraft");

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(true);
        }

        // Draft zones.
        this._draftZones = [];
        for (const zone of world.getAllZones()) {
            const savedData = zone.getSavedData() || "";
            if (!savedData.startsWith("__Franken__")) {
                continue;
            }
            const pos = zone.getPosition();
            const desk = world.TI4.getClosestPlayerDesk(pos);
            this._draftZones[desk.index] = zone;
        }

        // Faction sheets.
        this._factionSheets = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "sheet.faction:homebrew.franken/?") {
                continue;
            }
            const pos = obj.getPosition();
            const desk = world.TI4.getClosestPlayerDesk(pos);
            this._factionSheets[desk.index] = obj;
        }

        // Find the undraftable container.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "bag:base/generic") {
                continue;
            }
            const name = obj.getName();
            if (name !== "Undraftable") {
                continue;
            }
            this._undraftableContainer = obj;
            break;
        }
        assert(this._undraftableContainer);

        // Sources (name to object id stored in undraftable container)
        this._sources = [];
        const json = this._undraftableContainer.getSavedData();
        assert(json);
        for (const [key, id] of Object.entries(JSON.parse(json))) {
            const obj = world.getObjectById(id);
            if (obj) {
                this._sources[key] = obj;
            }
        }

        // Draft bags.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "bag:base/generic") {
                continue;
            }
            const name = obj.getName();
            if (!name.startsWith("Franken Components")) {
                continue;
            }
            this._deleteOnCancel.push(obj);
        }

        // Delete on cancel.
        for (const item of Object.values(this._sources)) {
            this._deleteOnCancel.push(item);
        }
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

        // Delete source boxes.
        for (const [key, obj] of Object.entries(sources)) {
            if (key === "undraftable") {
                continue; // keep this for later
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }

        return true;
    }

    _createFactionSheets() {
        const localPos = new Vector(18, 0, 10);
        const nsid = "sheet.faction:homebrew.franken/?";
        return world.TI4.getAllPlayerDesks().map((playerDesk) => {
            const pos = playerDesk.localPositionToWorld(localPos);
            const rot = playerDesk.rot;
            const sheet = Spawn.spawn(nsid, pos, rot);
            assert(sheet);
            sheet.snapToGround();
            sheet.setObjectType(ObjectType.Ground);
            return sheet;
        });
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

        world.TI4.config.setFranken(true);

        const destroyObjs = [];
        const factions = this._gatherFactionDefinitions(destroyObjs);
        if (!factions) {
            return false; // at least one incomplete, abort
        }
        for (const obj of destroyObjs) {
            assert(obj instanceof GameObject);
            if (obj.isValid()) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                if (obj instanceof Container) {
                    obj.clear();
                }
                obj.destroy();
            }
        }

        this._fillFactionSheets(factions);
        this._destroyExtras();
        this._unpackFactions(factions);

        FrankenFinalize.setTurnOrder();

        globalEvents.TI4.onFactionChanged.trigger();

        world.TI4.GameUI.goHome();
        return true;
    }

    _gatherFactionDefinitions(destroyObjs) {
        const factions =
            FrankenGenerateFaction.gatherFactionDefinitions(destroyObjs);
        assert(Array.isArray(factions));
        assert(factions.length === world.TI4.config.playerCount);

        let sawError = false;
        const playerDesks = world.TI4.getAllPlayerDesks();
        factions.forEach((faction, index) => {
            const playerSlot = playerDesks[index].playerSlot;
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const errors = [];
            FrankenGenerateFaction.isValid(faction, errors);
            if (errors.length > 0) {
                const msg = `**** Errors for ${playerName}: ${errors.join(
                    ", "
                )}`;
                Broadcast.chatAll(msg, Broadcast.ERROR);
                sawError = true;
            }
        });

        return sawError ? undefined : factions;
    }

    _fillFactionSheets(factions) {
        assert(Array.isArray(factions));
        assert(factions.length === world.TI4.config.playerCount);

        factions.forEach((faction, index) => {
            const obj = this._factionSheets[index];
            const frankenFactionSheet = obj.__frankenFactionSheet;
            assert(frankenFactionSheet);
            frankenFactionSheet.setFactionAttrs(faction.raw);
        });
    }

    _unpackFactions(factions) {
        assert(Array.isArray(factions));
        assert(factions.length === world.TI4.config.playerCount);

        const playerDesks = world.TI4.getAllPlayerDesks();
        factions.forEach((faction, index) => {
            const playerDesk = playerDesks[index];
            assert(playerDesk);

            new SetupStartingTech(playerDesk, faction).setup();
            new SetupStartingUnits(playerDesk, faction).setup();
            new SetupFactionTokens(playerDesk, faction).setup();
            new SetupHomeSystem(playerDesk, faction)._setupPlanetCards();
        });
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

        // Delete the faction sheets on cancel.
        this._deleteOnCancel.push(...this._factionSheets);
        this._factionSheets = [];

        this._destroyExtras();

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }
    }
}

if (!Franken.isDraftInProgress()) {
    Franken.destroyLingeringDraftZones();
}

module.exports = { Franken };
