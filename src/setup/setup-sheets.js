const { ObjectType, Vector, world } = require("../wrapper/api");
const SHEET_NSID_TO_TEMPLATE_GUID = require("./spawn/template/nsid-sheet.json");

const SHEET_DATA = [
    { nsid: "sheet:base/command", x: -4, y: 11, z: 6.5 },
    { nsid: "sheet:pok/leader", x: -4, y: -25, z: 6.5 },
];

class SetupSheets {
    static setup(deskData) {
        SHEET_DATA.map((sheetData) =>
            SetupSheets._setupSheet(deskData, sheetData)
        );
    }

    static _setupSheet(deskData, sheetData) {
        const sheetPos = new Vector(sheetData.x, sheetData.y, sheetData.z)
            .rotateAngleAxis(deskData.rot.yaw, [0, 0, 1])
            .add(deskData.pos);

        const sheetTemplateId = SHEET_NSID_TO_TEMPLATE_GUID[sheetData.nsid];
        if (!sheetTemplateId) {
            throw new Error(`cannot find ${sheetData.nsid}`);
        }

        const obj = world.createObjectFromTemplate(sheetTemplateId, sheetPos);
        obj.setRotation(deskData.rot);
        obj.setObjectType(ObjectType.Ground);

        // TODO XXX PLAYER SLOT
    }
}

module.exports = { SetupSheets };
