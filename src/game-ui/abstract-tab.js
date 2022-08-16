const { UIElement } = require("../wrapper/api");

class AbstractTab {
    getTabName() {
        throw new Error("subclass should override");
    }

    getTabIcon() {
        // is this a good idea?
        throw new Error("subclass should override");
    }

    getTabUi() {
        throw new Error("subclass should override");
    }
}

module.exports = { AbstractTab };
