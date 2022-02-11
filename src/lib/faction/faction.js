const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { PlayerDesk } = require("../player-desk");
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
            const playerDesk = PlayerDesk.getClosest(obj.getPosition());
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
        }
    }
}

class Faction {
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

    constructor(factionAttrs) {
        this._factionAttrs = factionAttrs;
    }

    get raw() {
        return this._factionAttrs;
    }
}

module.exports = { Faction };
