const { TabFogOfWarUI } = require("./tab-fog-ui");

class TabFogOfWar {
    constructor() {
        const onClickHandlers = {
            toggleEnable: () => {},
        };
        this._ui = new TabFogOfWarUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabFogOfWar };
