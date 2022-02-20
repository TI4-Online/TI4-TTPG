const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectType } = require("../wrapper/api");
const { Spawn } = require("./spawn/spawn");
const { FACTION_SHEET } = require("./faction/setup-faction-sheet");

const SHEET_DATA = [
    {
        nsid: "sheet:base/command",
        pos: { x: FACTION_SHEET.pos.x, y: FACTION_SHEET.pos.y + 20.8, z: 1 },
    },
    {
        nsid: "sheet:pok/leader",
        pos: { x: FACTION_SHEET.pos.x, y: FACTION_SHEET.pos.y - 19, z: 1 },
    },
];

class SetupSheets extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        SHEET_DATA.map((sheetData) => this._setupSheet(sheetData));
    }

    clean() {
        SHEET_DATA.map((sheetData) => this._cleanSheet(sheetData));
    }

    _setupSheet(sheetData) {
        const pos = this.playerDesk.localPositionToWorld(sheetData.pos);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;

        const obj = Spawn.spawn(sheetData.nsid, pos, rot);
        obj.setObjectType(ObjectType.Ground);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setPrimaryColor(color);
    }

    _cleanSheet(sheetData) {
        const obj = this.findObjectOwnedByPlayerDesk(sheetData.nsid);
        if (obj) {
            obj.destroy();
        }
    }
}

module.exports = { SetupSheets };
