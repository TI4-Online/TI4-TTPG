const locale = require("../../lib/locale");
const { MapTool } = require("./tab-map-tool/map-tool");
const { PremadeMap } = require("./tab-premade/premade-map");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabDraft } = require("./tab-draft/tab-draft");
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

        const draft = new TabDraft();
        this._tabbedPanel.addTab(locale("ui.tab.map.draft"), draft.getUI());

        this._tabbedPanel.addTab("Borders", new Border());
        this._tabbedPanel.addTab("Fog", new Border());
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabMap };
