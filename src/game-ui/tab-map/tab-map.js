const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { MapTool } = require("./tab-map-tool/map-tool");
const { MiltyDraft } = require("../../lib/draft/milty/milty-draft");
const { SCPTDraft } = require("../../lib/draft/scpt/scpt-draft");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const CONFIG = require("../game-ui-config");

class TabMap {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        this._tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const mapTool = new MapTool(doRefresh);
        const miltyDraft = new MiltyDraft();
        const scptDraft = new SCPTDraft();

        this._tabbedPanel
            .addTab(locale("ui.tab.map.map_tool"), mapTool.getUI(), true)
            .addTab(locale("ui.tab.map.milty_draft"), miltyDraft.getUI())
            .addTab(locale("ui.tab.map.scpt_draft"), scptDraft.getUI());
    }

    getUI() {
        return this._tabbedPanel;
    }
}

module.exports = { TabMap };
