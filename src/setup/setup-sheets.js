const { AbstractSetup } = require("./abstract-setup");
const { ObjectType } = require("../wrapper/api");
const { Spawn } = require("./spawn/spawn");

const SHEET_DATA = [
    { nsid: "sheet:base/command", pos: { x: -4, y: 11, z: 6.5 } },
    { nsid: "sheet:pok/leader", pos: { x: -4, y: -25, z: 6.5 } },
];

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
    }
}

module.exports = { SetupSheets };
