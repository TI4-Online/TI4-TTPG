const assert = require("../../../../wrapper/assert-wrapper");
const { BagDraft } = require("../../../../lib/draft/bag/bag-draft");
const { TabBagDraftUI } = require("./tab-bag-ui");
const { Player } = require("../../../../wrapper/api");

class TabBagDraft {
    constructor() {
        const callbacks = {
            onFinish: (settings, player) => {
                return this._onFinish(settings, player);
            },
            onCancel: (player) => {
                return this._onCancel(player);
            },
        };

        this._bagDraft = undefined;
        this._ui = new TabBagDraftUI(callbacks);
    }

    getUI() {
        return this._ui.getWidget();
    }

    _onFinish(settings, player) {
        assert(player instanceof Player);
        console.log(`TabBagDraft._onFinish: ${JSON.stringify(settings)}`);

        this._bagDraft = new BagDraft()
            .setBlueCount(settings.blue)
            .setRedCount(settings.red)
            .setFactionCount(settings.faction)
            .start();

        return true;
    }
    _onCancel(player) {
        assert(player instanceof Player);
        console.log("TabBagDraft._onCancel");
        if (this._bagDraft) {
            this._bagDraft.cancel();
            this._bagDraft = undefined;
        }
    }
}

module.exports = { TabBagDraft };
