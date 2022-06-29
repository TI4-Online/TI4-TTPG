const { AutoRoller } = require("../../../objects/roller/auto-roller");

class TabTactical {
    constructor() {
        const autoRoller = new AutoRoller();
        this._ui = autoRoller.getUI();
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabTactical };
