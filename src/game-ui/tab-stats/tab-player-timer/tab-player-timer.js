const { TabPlayerTimerUI } = require("./tab-player-timer-ui");
const { world } = require("../../../wrapper/api");

class TabPlayerTimer {
    constructor() {
        this._tabPlayerTimerUI = undefined;
    }

    getUI() {
        if (!this._tabPlayerTimerUI) {
            this._tabPlayerTimerUI = new TabPlayerTimerUI();
        }
        this.updateUI(world.TI4.playerTimer);
        return this._tabPlayerTimerUI.getWidget();
    }

    updateUI() {
        if (!this._tabPlayerTimerUI) {
            return;
        }
        this._tabPlayerTimerUI.update(world.TI4.playerTimer);
    }
}

module.exports = { TabPlayerTimer };
