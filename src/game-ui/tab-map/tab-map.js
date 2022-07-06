const locale = require("../../lib/locale");
const { MapTool } = require("./tab-map-tool/map-tool");
const { PremadeMap } = require("./tab-premade/premade-map");
const { TabDisplay } = require("./tab-display/tab-display");
const { TabDraft } = require("./tab-draft/tab-draft");
const { TabFogOfWar } = require("./tab-fog/tab-fog");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");

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

        const display = new TabDisplay();
        this._tabbedPanel.addTab(locale("ui.tab.map.display"), display.getUI());

        const fog = new TabFogOfWar();
        this._tabbedPanel.addTab(locale("ui.tab.map.fog"), fog.getUI());
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabMap };
