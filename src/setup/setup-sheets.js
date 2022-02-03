const { Spawn } = require("./spawn/spawn");
const { ObjectType, Vector } = require("../wrapper/api");

const SHEET_DATA = [
    { nsid: "sheet:base/command", x: -4, y: 11, z: 6.5 },
    { nsid: "sheet:pok/leader", x: -4, y: -25, z: 6.5 },
];

class SetupSheets {
    static setupDesk(deskData) {
        SHEET_DATA.map((sheetData) =>
            SetupSheets._setupSheet(deskData, sheetData)
        );
    }

    static _setupSheet(deskData, sheetData) {
        const sheetPos = new Vector(sheetData.x, sheetData.y, sheetData.z)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);

        const obj = Spawn.spawn(sheetData.nsid, sheetPos, deskData.rot);
        obj.setObjectType(ObjectType.Ground);
        obj.setOwningPlayerSlot(deskData.playerSlot);
    }
}

module.exports = { SetupSheets };
