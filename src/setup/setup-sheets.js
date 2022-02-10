const { AbstractSetup } = require("./abstract-setup");
const { ObjectType } = require("../wrapper/api");
const { Spawn } = require("./spawn/spawn");
const { FACTION_SHEET } = require("./setup-faction");

const SHEET_DATA = [
    {
        nsid: "sheet:base/command",
        pos: { x: FACTION_SHEET.pos.x, y: FACTION_SHEET.pos.y + 20.8, z: 6.5 },
    },
    {
        nsid: "sheet:pok/leader",
        pos: { x: FACTION_SHEET.pos.x, y: FACTION_SHEET.pos.y - 19, z: 6.5 },
    },
];

const SHEET_SCALE_Z = 0.16;

class SetupSheets extends AbstractSetup {
    constructor(playerDesk) {
        super();
        this.setPlayerDesk(playerDesk);
    }

    setup() {
        SHEET_DATA.map((sheetData) => this._setupSheet(sheetData));
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
        obj.setScale([1, 1, SHEET_SCALE_Z]);
    }
}

module.exports = { SetupSheets };
