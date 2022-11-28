const { TabWhispersUI } = require("./tab-whispers-ui");

class TabWhispers {
    constructor() {
        this._tabWhispersUI = new TabWhispersUI();
    }

    getUI() {
        return this._tabWhispersUI.getWidget();
    }

    updateUI() {
        this._tabWhispersUI.update();
    }
}

module.exports = { TabWhispers };
