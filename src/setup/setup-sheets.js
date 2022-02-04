const { PlayerArea } = require("../lib/player-area");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector } = require("../wrapper/api");

const SHEET_DATA = [
    { nsid: "sheet:base/command", x: -4, y: 11, z: 6.5 },
    { nsid: "sheet:pok/leader", x: -4, y: -25, z: 6.5 },
];

class SetupSheets {
    static setupDesk(playerDesk) {
        SHEET_DATA.map((sheetData) =>
            SetupSheets._setupSheet(playerDesk, sheetData)
        );
    }

    static _setupSheet(playerDesk, sheetData) {
        const sheetPos = new Vector(sheetData.x, sheetData.y, sheetData.z)
            .rotateAngleAxis(playerDesk.rot.yaw, [0, 0, 1])
            .add(playerDesk.pos);

        const slotColor = PlayerArea.getPlayerSlotColor(playerDesk.playerSlot);

        const obj = Spawn.spawn(sheetData.nsid, sheetPos, playerDesk.rot);
        obj.setObjectType(ObjectType.Ground);
        obj.setOwningPlayerSlot(playerDesk.playerSlot);
        obj.setPrimaryColor(slotColor);
    }
}

module.exports = { SetupSheets };
