const locale = require("../../lib/locale");
const { MapTool } = require("./tab-map-tool/map-tool");
const { MiltyDraftSettings } = require("./tab-milty/milty-draft-settings");
const { PremadeMap } = require("./tab-premade/premade-map");
const { SCPTDraftSettings } = require("./tab-scpt/scpt-draft-settings");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");
const { Border } = require("../../wrapper/api");

class TabMap {
    constructor() {
        this._tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const mapTool = new MapTool();
        this._tabbedPanel.addTab(
            locale("ui.tab.map.map_tool"),
            mapTool.getUI(),
            true
        );
        const premade = new PremadeMap();
        this._tabbedPanel.addTab(locale("ui.tab.map.premade"), premade.getUI());

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

        //this._tabbedPanel.addTab("Fog", new Border());
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabMap };
