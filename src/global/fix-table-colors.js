const { ColorUtil } = require("../lib/color/color-util");
const { world } = require("../wrapper/api");

for (const table of world.getAllTables()) {
    if (table.getTemplateMetadata() === "table:base/6p_skinny") {
        // CURRENT:
        table.setPrimaryColor(ColorUtil.colorFromHex("#494949"));
        table.setSecondaryColor(ColorUtil.colorFromHex("#383838"));

        //table.setPrimaryColor(ColorUtil.colorFromHex("#383838"));
        //table.setSecondaryColor(ColorUtil.colorFromHex("#282828"));
    }
}
