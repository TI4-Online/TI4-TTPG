const { TabBagDraftUI } = require("./tab-bag-ui");

class TabBagDraft {
    constructor() {
        this._ui = new TabBagDraftUI();
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabBagDraft };
