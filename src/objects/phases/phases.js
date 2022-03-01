const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabStatus } = require("./tab-status");
const { TabStrategy } = require("./tab-strategy");
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
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Rotator } = require("@tabletop-playground/api");

class Phases {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        const mapTool = new MapTool();
        const tabStrategy = new TabStrategy();
        const autoRoller = new AutoRoller();
        const tabStatus = new TabStatus();

        const tabbedPanel = new TabbedPanel(true)
            .addTab(locale("ui.tab.map_tool"), mapTool.getUI())
            .addTab(locale("ui.tab.strategy_phase"), tabStrategy.getUI())
            .addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())
            .addTab(locale("ui.tab.status_phase"), tabStatus.getUI())
            .addTab(
                locale("ui.tab.agenda_phase"),
                new Text().setText("< work in progress >")
            );

        const w = 450;
        const layoutBox = new LayoutBox()
            .setChild(tabbedPanel)
            .setMaximumWidth(w)
            .setMinimumWidth(w)
            .setMinimumHeight(60);

        const uiElement = new UIElement();
        uiElement.anchorY = 0;
        uiElement.position = new Vector(0, 0, 5);
        uiElement.widget = layoutBox;

        if (ObjectNamespace.getNsid(gameObject) === "mat:base/strategy_card") {
            uiElement.position = new Vector(0, 15, 2);
            uiElement.rotation = new Rotator(0, 90, 0);
        }

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
