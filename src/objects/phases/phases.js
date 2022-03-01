const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabStrategyUI } = require("./tab-strategy-ui");
const { TabActionUI } = require("./tab-action-ui");
const {
    GameObject,
    LayoutBox,
    Text,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../../wrapper/api");
const { MapTool } = require("../map-tool/map-tool");
const { AutoRoller } = require("../roller/auto-roller");

class Phases {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        const mapTool = new MapTool();
        const autoRoller = new AutoRoller();

        const tabbedPanel = new TabbedPanel()
            .addTab("ui.tab.map_tool", mapTool.getUI())
            .addTab(locale("ui.phase.strategy.label"), new TabStrategyUI())
            .addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())
            .addTab(
                locale("ui.phase.status.label"),
                new Text().setText("status here")
            )
            .addTab(
                locale("ui.phase.agenda.label"),
                new Text().setText("agenda here")
            );

        const w = 450;
        const layoutBox = new LayoutBox()
            .setChild(tabbedPanel)
            .setMaximumWidth(w)
            .setMinimumWidth(w);

        const uiElement = new UIElement();
        uiElement.anchorY = 0;
        uiElement.position = new Vector(0, 0, 5);
        uiElement.widget = layoutBox;
        gameObject.addUI(uiElement);

        mapTool.getUI().setOwningObjectForUpdate(gameObject, uiElement);
        autoRoller.getUI().setOwningObjectForUpdate(gameObject, uiElement);
    }
}

refObject.onCreated.add((obj) => {
    console.log("Phases onCreated");
    new Phases(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    console.log("Phases ScriptReload");
    new Phases(refObject);
}
