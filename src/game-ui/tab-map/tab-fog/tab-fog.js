const { world } = require("@tabletop-playground/api");
const { TabFogOfWarUI } = require("./tab-fog-ui");

class TabFogOfWar {
    constructor() {
        const onClickHandlers = {
            toggleEnable: (checkBox, player, isChecked) => {
                world.TI4.fogOfWar.setEnabled(isChecked);
            },
        };
        this._ui = new TabFogOfWarUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabFogOfWar };
