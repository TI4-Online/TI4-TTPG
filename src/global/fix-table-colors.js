const { ColorUtil } = require("../lib/color/color-util");
const { world } = require("../wrapper/api");

/**
 * This is necessary for existing save games.  New games start with the expected colors.
 * Retire this eventually (expected launch SEPT 2023).
 */
for (const table of world.getAllTables()) {
    if (table.getTemplateMetadata().startsWith("table:base/")) {
        const primary = table.getPrimaryColor();
        const secondary = table.getSecondaryColor();
        if (primary.r < 0.99 || secondary.r > 0.01) {
            continue; // colors already set
        }

        // CURRENT:
        table.setPrimaryColor(ColorUtil.colorFromHex("#494949"));
        table.setSecondaryColor(ColorUtil.colorFromHex("#383838"));
    }
}
