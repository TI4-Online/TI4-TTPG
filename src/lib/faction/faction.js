const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const lodash = require("lodash");
const { FactionSchema } = require("./faction.schema");
const { ObjectNamespace } = require("../object-namespace");
const { FACTION_DATA } = require("./faction.data");
const { globalEvents, world } = require("../../wrapper/api");

let _nsidNameToFaction = false;
let _playerSlotToFaction = false;

globalEvents.onPlayerSwitchedSlots.add((player, index) => {
    _playerSlotToFaction = false; // invalidate cache
});

globalEvents.TI4.onFactionChanged.add((deskPlayerSlot, player) => {
    _playerSlotToFaction = false; // invalidate cache
});

function _maybeInit() {
    if (!_nsidNameToFaction) {
        _nsidNameToFaction = {};
        FACTION_DATA.forEach((factionAttrs) => {
            // "merge" copies the named faction and applies local updates.
            if (factionAttrs.merge) {
                let newFactionAttrs = undefined;
                for (const faction of FACTION_DATA) {
                    if (faction.faction === factionAttrs.merge) {
                        newFactionAttrs = lodash.cloneDeep(faction);
                        delete newFactionAttrs.abstract;
                        break;
                    }
                }
                assert(newFactionAttrs);
                factionAttrs = lodash.merge(newFactionAttrs, factionAttrs);
            }
            const faction = new Faction(factionAttrs);
            _nsidNameToFaction[faction.raw.faction] = faction;
        });
    }

    if (!_playerSlotToFaction) {
        _playerSlotToFaction = {};

        // Find all faction sheets, each player desk gets the closest.  Watch
        // out for extra faction sheets on the table!
        // In a franken game, this would build the faction from franken tokens.
        const slotToSheet = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // inside a container
            }
            if (!ObjectNamespace.isFactionSheet(obj)) {
                continue; // not a faction sheet
            }
            const pos = obj.getPosition();
            const playerDesk = world.TI4.getClosestPlayerDesk(pos);
            const playerSlot = playerDesk.playerSlot;
            const existing = slotToSheet[playerSlot];
            if (existing) {
                const deskCenter = playerDesk.center;
                const dExisting = existing.getPosition().distance(deskCenter);
                const dCandidate = obj.getPosition().distance(deskCenter);
                if (dExisting <= dCandidate) {
                    continue; // existing is closer
                }
            }
            slotToSheet[playerSlot] = obj;
        }
        // Translate sheet to faction, make sure to share same Faction objects!
        for (const [slot, sheet] of Object.entries(slotToSheet)) {
            const nsidName = ObjectNamespace.parseFactionSheet(sheet).faction;
            const faction = Faction.getByNsidName(nsidName);
            if (!faction) {
                const nsid = ObjectNamespace.getNsid(sheet);
                throw new Error(`unknown faction from sheet "${nsid}"`);
            }
            _playerSlotToFaction[slot] = faction;

            // Remember the last player slot associated with the faction.
            // This breaks if more than one player is using this faction.
            faction._playerSlot = slot;
        }
    }
}

class Faction {
    /**
     * Get all currently available factions (filter PoK, Codex 3, etc).
     *
     * @returns {Array.{Faction}}
     */
    static getAllFactions() {
        _maybeInit();
        // Restrict to available factions.
        return [...Object.values(_nsidNameToFaction)].filter((faction) => {
            if (faction.raw.abstract) {
                return false;
            }
            if (faction.nsidSource === "pok" && !world.TI4.config.pok) {
                return false;
            }
            if (
                faction.nsidSource === "codex.vigil" &&
                !world.TI4.config.codex3
            ) {
                return false;
            }
            return true;
        });
    }

    static getByPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        _maybeInit();
        return _playerSlotToFaction[playerSlot];
    }

    static getByNsidName(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _nsidNameToFaction[nsidName];
    }

    static injectFaction(factionAttrs) {
        assert(factionAttrs);
        FactionSchema.validate(factionAttrs, (err) => {
            throw new Error(`Faction.injectFaction schema error "${err}"`);
        });
        assert(Array.isArray(FACTION_DATA));
        FACTION_DATA.push(factionAttrs);
        _nsidNameToFaction = undefined;
    }

    constructor(factionAttrs) {
        this._factionAttrs = factionAttrs;
    }

    get raw() {
        return this._factionAttrs;
    }

    get home() {
        return this._factionAttrs.home;
    }

    get nsidName() {
        return this._factionAttrs.faction;
    }

    get icon() {
        return this._factionAttrs.icon;
    }

    get nsidSource() {
        return this._factionAttrs.source;
    }

    get nameAbbr() {
        return locale("faction.abbr." + this.nsidName);
    }

    get nameFull() {
        return locale("faction.full." + this.nsidName);
    }

    get homeNsid() {
        // Codex 3 uses home systems from a different source than faction.
        // Get source from system tile.
        const system = world.TI4.getSystemByTileNumber(this.home);
        assert(system);
        return `tile.system:${system.raw.source}/${this.home}`;
    }

    get playerSlot() {
        return this._playerSlot;
    }
}

module.exports = { Faction };
