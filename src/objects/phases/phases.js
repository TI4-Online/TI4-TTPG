const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabStrategyUI } = require("./tab-strategy-ui");
const {
    GameObject,
    Text,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../../wrapper/api");
const { TabActionUI } = require("./tab-action-ui");

class Phases {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        this._obj = gameObject;

        this._tabbedPanel = new TabbedPanel();

        this._tabbedPanel.addTab(
            locale("ui.phase.strategy.label"),
            new TabStrategyUI()
        );
        this._tabbedPanel.addTab(
            locale("ui.phase.action.label"),
            new TabActionUI()
        );
        this._tabbedPanel.addTab(
            locale("ui.phase.status.label"),
            new Text().setText("status here")
        );
        this._tabbedPanel.addTab(
            locale("ui.phase.agenda.label"),
            new Text().setText("agenda here")
        );

        this._uiElement = new UIElement();
        this._uiElement.position = new Vector(0, 0, 5);
        this._uiElement.useWidgetSize = false;
        this._uiElement.width = 500;
        this._uiElement.height = 500;
        this._uiElement.widget = this._tabbedPanel;
        this._obj.addUI(this._uiElement);
    }
}

refObject.onCreated.add((obj) => {
    new Phases(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new Phases(refObject);
}
