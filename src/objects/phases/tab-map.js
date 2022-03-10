const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { MapTool } = require("../map-tool/map-tool");
const { MiltyDraft } = require("../../lib/draft/milty/milty-draft");
const { SCPTDraft } = require("../../lib/draft/scpt/scpt-draft");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { GameObject, UIElement } = require("../../wrapper/api");

class TabMap {
    constructor(gameObject, uiElement) {
        assert(gameObject instanceof GameObject);
        assert(uiElement instanceof UIElement);

        this._tabbedPanel = new TabbedPanel();

        const mapTool = new MapTool();
        const miltyDraft = new MiltyDraft();
        const scptDraft = new SCPTDraft();

        mapTool.getUI().setOwningObjectForUpdate(gameObject, uiElement);

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
