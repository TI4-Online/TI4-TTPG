const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { MapTool } = require("./tab-map-tool/map-tool");
const { MiltyDraftSettings } = require("./tab-milty/milty-draft-settings");
const { SCPTDraftSettings } = require("./tab-scpt/scpt-draft-settings");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");

class TabMap {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        this._tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const mapTool = new MapTool(doRefresh);
        this._tabbedPanel.addTab(
            locale("ui.tab.map.map_tool"),
            mapTool.getUI(),
            true
        );

        const miltyDraftSettings = new MiltyDraftSettings();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.milty_draft"),
            miltyDraftSettings.getUI()
        );

        const scptDraftSettings = new SCPTDraftSettings();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.scpt_draft"),
            scptDraftSettings.getUI()
        );
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabMap };
