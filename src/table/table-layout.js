const layout = require("./layout-v5");

class TableLayout {
    static desks() {
        return layout.desks;
    }

    static get anchor() {
        return layout.deskLayout.anchor;
    }
}

module.exports = { TableLayout };
