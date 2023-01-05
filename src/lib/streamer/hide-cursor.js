const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { ZonePermission, world } = require("../../wrapper/api");

const ZONE_ID = "__hideCursor__";
const ZONE_HEIGHT = 40;

/**
 * Create a large zone applying "hide cursor" so streamer cursors are invisible to players.
 */
class HideCursor {
    constructor() {
        this._zone = undefined;

        const pos = [0, 0, world.getTableHeight() + ZONE_HEIGHT / 2 - 1];
        const scale = [600, 600, ZONE_HEIGHT];

        // Does the zone already exist?
        for (const zone of world.getAllZones()) {
            if (zone.getId() === ZONE_ID) {
                this._zone = zone;
                break;
            }
        }
        if (!this._zone) {
            this._zone = world.createZone(pos);
        }

        this._zone.setAlwaysVisible(false);
        this._zone.setColor([1, 0, 0, 0.1]);
        this._zone.setCursorHidden(ZonePermission.OwnersOnly);
        this._zone.setId(ZONE_ID);
        this._zone.setPosition(pos);
        this._zone.setScale(scale);
    }

    hasPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        return this._zone.isSlotOwner(playerSlot);
    }

    addPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            if (playerDesk.playerSlot === playerSlot) {
                Broadcast.chatAll(
                    locale("hide_cursor.cannot_hide_player_desk_slot"),
                    Broadcast.ERROR
                );
                return;
            }
        }

        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        Broadcast.chatAll(locale("hide_cursor.hide", { playerName }));

        this._zone.setSlotOwns(playerSlot, true);
        return this;
    }

    removePlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");

        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        Broadcast.chatAll(locale("hide_cursor.show", { playerName }));

        this._zone.setSlotOwns(playerSlot, false);
        return this;
    }

    togglePlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        if (this.hasPlayerSlot(playerSlot)) {
            this.removePlayerSlot(playerSlot);
        } else {
            this.addPlayerSlot(playerSlot);
        }
    }
}

module.exports = { HideCursor };
