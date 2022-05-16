const { TabBordersUI } = require("./tab-border-ui");
const { world } = require("../../../wrapper/api");

class TabBorders {
    constructor() {
        const onClickHandlers = {
            toggleBorders: (checkBox, player, isChecked) => {
                this.toggleBorders(isChecked);
            },
        };
        this._ui = new TabBordersUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    toggleBorders(isChecked) {
        console.log(`TabBorders.toggleBorders ${isChecked}`);
        world.TI4.borders.setEnabled(isChecked);
    }
}

module.exports = { TabBorders };
