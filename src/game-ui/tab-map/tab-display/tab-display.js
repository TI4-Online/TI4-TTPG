const { TabDisplayUI } = require("./tab-display-ui");
const { world } = require("../../../wrapper/api");
const {
    SystemTileBrightness,
} = require("../../../lib/ui/system-tile-brightness");

class TabDisplay {
    constructor() {
        const onClickHandlers = {
            toggleBorders: (checkBox, player, isChecked) => {
                this.toggleBorders(isChecked);
            },
            systemBrightnessChanged: (slider, player, value) => {
                const u = value / slider.getMaxValue();
                this.updateBrightness(u);
            },
        };
        this._ui = new TabDisplayUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    toggleBorders(isChecked) {
        console.log(`TabDisplay.toggleBorders ${isChecked}`);
        world.TI4.borders.setEnabled(isChecked);
    }

    updateBrightness(value) {
        console.log(`TabDisplay.updateBrightness ${value}`);
        SystemTileBrightness.set(value);
    }
}

module.exports = { TabDisplay };
