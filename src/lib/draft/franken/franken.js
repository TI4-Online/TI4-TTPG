const assert = require("../../../wrapper/assert-wrapper");
const _ = require("lodash");
const { Broadcast } = require("../../broadcast");
const { FactionAbilitySchema } = require("./franken.schema");
const { FACTION_ABILITIES } = require("./franken.data");
const { FrankenCreateSources } = require("./franken-create-sources");
const { FRANKEN_DRAFT_CONFIG } = require("./franken-draft-config");
const { FrankenUndraftable } = require("./franken-undraftable");
const { FrankenGenerateFaction } = require("./franken-generate-faction");
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
        this._factionSheets = [];

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

        const factions = this._gatherFactionDefinitions();
        this._fillFactionSheets(factions);
        this._destroyExtras();

        globalEvents.TI4.onFactionChanged.trigger();

        world.TI4.GameUI.goHome();
        return true;
    }

    _gatherFactionDefinitions() {
        const factions = FrankenGenerateFaction.gatherFactionDefinitions();
        assert(Array.isArray(factions));
        assert(factions.length === world.TI4.config.playerCount);

        const playerDesks = world.TI4.getAllPlayerDesks();
        const errors = [];
        factions.forEach((faction, index) => {
            const playerSlot = playerDesks[index].playerSlot;
            FrankenGenerateFaction.isValid(faction, playerSlot, errors);
        });

        if (errors.length > 0) {
            Broadcast.chatAll(errors.join("\n"), Broadcast.ERROR);
        }
        return factions;
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

        this._deleteOnCancel.push(...this._factionSheets);
        this._factionSheets = [];

        this._destroyExtras();

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.setReady(false);
        }
    }
}

Franken.destroyLingeringDraftZones();

module.exports = { Franken };
