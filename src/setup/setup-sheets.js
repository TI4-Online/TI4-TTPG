const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Vector } = require("../wrapper/api");

const SHEET_DATA = [
    {
        nsid: "sheet:base/command",
        pos: { x: 0, y: 20.8 },
    },
    {
        nsid: "sheet:pok/leader",
        pos: { x: 0, y: -19 },
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
        const layout = TableLayout.deskLayout().factionSheet;
        let pos = new Vector(
            layout.pos.x + sheetData.pos.x,
            layout.pos.y + sheetData.pos.y,
            2
        );
        pos = this.playerDesk.localPositionToWorld(pos);
        const rot = this.playerDesk.rot;

        const obj = Spawn.spawn(sheetData.nsid, pos, rot);

        const playerSlot = this.playerDesk.playerSlot;
        const color = this.playerDesk.color;

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
