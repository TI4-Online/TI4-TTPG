const { TabBordersUI } = require("./tab-border-ui");

class TabBorders {
    constructor() {
        const onClickHandlers = {
            toggleEnable: () => {},
        };
        this._ui = new TabBordersUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabBorders };
