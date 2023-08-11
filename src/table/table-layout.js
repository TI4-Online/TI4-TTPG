const assert = require("../wrapper/assert-wrapper");
const { Rotator, Vector, world } = require("../wrapper/api");

let _layout; // fill with the table javascript

class TableLayout {
    static getTableType() {
        let results = [];
        for (const table of world.getAllTables()) {
            const metadata = table.getTemplateMetadata();
            if (metadata === "table:base/6p_skinny") {
                results.push("6p-skinny");
            } else if (metadata === "table:base/8p_skinny") {
                results.push("8p-skinny");
            } else if (metadata === "table:base/8p_round") {
                results.push("8p-2x-common-ext");
            } else if (metadata === "table:base/8p_huge") {
                results.push("8p-huge");
            }
        }
        if (results.length === 0) {
            throw new Error("TableLayout.getTableType: no table");
        }
        if (results.length > 1) {
            console.log(
                "TableLayout.getTableType: multiple tables, using first"
            );
        }
        return results[0];
    }

    static loadTableLayout() {
        if (_layout) {
            throw new Error("TableLayout.loadTableLayout: already loaded");
        }

        const path = TableLayout.getTableType();
        if (!world.__isMock) {
            console.log(`TableLayout.loadTableLayout "${path}"`);
        }

        _layout = require(`./${path}`);
    }

    static desks() {
        return _layout.desks;
    }

    static get anchor() {
        return _layout.deskLayout.anchor;
    }

    static anchorPositionToWorld(anchor, pos) {
        assert(anchor);
        assert(typeof anchor.pos.x === "number");
        assert(typeof anchor.pos.y === "number");
        assert(typeof anchor.pos.z === "number");
        assert(typeof anchor.yaw === "number");
        assert(pos);
        assert(typeof pos.x === "number");
        assert(typeof pos.y === "number");
        return new Vector(pos.x, pos.y, world.getTableHeight())
            .rotateAngleAxis(anchor.yaw, [0, 0, 1])
            .add(new Vector(anchor.pos.x, anchor.pos.y, anchor.pos.z));
    }

    static anchorRotationToWorld(anchor, rot) {
        assert(anchor);
        assert(typeof anchor.yaw === "number");
        assert(rot);
        return new Rotator(0, anchor.yaw, 0).compose(rot);
    }

    static get supportsLargeHexes() {
        return _layout.supportsLargeHexes;
    }
}

TableLayout.loadTableLayout();

module.exports = { TableLayout };
