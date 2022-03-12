const layout = require("./8p-2x-common-ext");

class TableLayout {
    static desks() {
        return layout.desks;
    }

    static get anchor() {
        return layout.deskLayout.anchor;
    }
}

module.exports = { TableLayout };
