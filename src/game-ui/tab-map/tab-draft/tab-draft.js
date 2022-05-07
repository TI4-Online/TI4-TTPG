const locale = require("../../../lib/locale");
const { MiltyDraftSettings } = require("./tab-milty/milty-draft-settings");
const { SCPTDraftSettings } = require("./tab-scpt/scpt-draft-settings");
const { TabbedPanel } = require("../../../lib/ui/tabbed-panel");
const CONFIG = require("../../game-ui-config");
const { TabBagDraft } = require("./tab-bag/tab-bag");

class TabDraft {
    constructor() {
        this._tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const miltyDraftSettings = new MiltyDraftSettings();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.draft.milty_draft"),
            miltyDraftSettings.getUI()
        );

        const scptDraftSettings = new SCPTDraftSettings();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.draft.scpt_draft"),
            scptDraftSettings.getUI()
        );

        const bagDraft = new TabBagDraft();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.draft.bag_draft"),
            bagDraft.getUI()
        );
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabDraft };
