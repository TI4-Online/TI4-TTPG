const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");
const { ColorUtil } = require("../color/color-util");

class TableColor {
    static getTable() {
        for (const table of world.getAllTables()) {
            const nsid = ObjectNamespace.getNsid(table);
            if (nsid && nsid.startsWith("table:")) {
                return table;
            }
        }
    }

    static getPrimary() {
        const table = TableColor.getTable();
        assert(table);
        return table.getPrimaryColor();
    }

    static getSecondary() {
        const table = TableColor.getTable();
        assert(table);
        return table.getSecondaryColor();
    }

    static setPrimary(color) {
        const table = TableColor.getTable();
        assert(table);
        table.setPrimaryColor(color);
    }

    static setSecondary(color) {
        const table = TableColor.getTable();
        assert(table);
        table.setSecondaryColor(color);
    }

    static resetToDefaults() {
        TableColor.setPrimary(ColorUtil.colorFromHex("#484848"));
        TableColor.setSecondary(ColorUtil.colorFromHex("#383838"));
    }

    static resetToDark() {
        TableColor.setPrimary(ColorUtil.colorFromHex("#2c2c2c"));
        TableColor.setSecondary(ColorUtil.colorFromHex("#383838"));
    }

    static isDark() {
        return Math.abs(TableColor.getPrimary().r - 0.1725) < 0.01;
    }
}

module.exports = { TableColor };
