const layout = require("./layout-round-8p-double-wide-common");

class TableLayout {
    static desks() {
        return layout.desks;
    }

    static get anchor() {
        return layout.deskLayout.anchor;
    }
}

module.exports = { TableLayout };
