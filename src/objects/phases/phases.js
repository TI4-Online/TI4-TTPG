const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRoller } = require("../roller/auto-roller");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabMap } = require("./tab-map");
const { TabStatus } = require("./tab-status");
const { TabStrategy } = require("./tab-strategy");
const { TurnOrderPanel } = require("../../lib/ui/turn-order-panel");
const {
    GameObject,
    LayoutBox,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    Rotator,
    refObject,
    world,
} = require("../../wrapper/api");

class Phases {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        const uiElement = new UIElement();

        const tabMap = new TabMap(gameObject, uiElement);
        const tabStrategy = new TabStrategy();
        const autoRoller = new AutoRoller();
        const tabStatus = new TabStatus();

        const turnOrderPanel = new TurnOrderPanel();

        const tabbedPanel = new TabbedPanel(true)
            .addTab(locale("ui.tab.map"), tabMap.getUI())
            .addTab(locale("ui.tab.strategy_phase"), tabStrategy.getUI())
            .addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())
            .addTab(locale("ui.tab.status_phase"), tabStatus.getUI())
            .addTab(
                locale("ui.tab.agenda_phase"),
                new Text().setText("< work in progress >")
            );

        const overall = new VerticalBox()
            .addChild(turnOrderPanel)
            .addChild(tabbedPanel);

        const w = 450;
        const layoutBox = new LayoutBox()
            .setChild(overall)
            .setMaximumWidth(w)
            .setMinimumWidth(w)
            .setMinimumHeight(60);

        uiElement.anchorY = 0;
        uiElement.position = new Vector(0, 0, 5);
        uiElement.widget = layoutBox;

        if (ObjectNamespace.getNsid(gameObject) === "mat:base/strategy_card") {
            uiElement.position = new Vector(0, 15, 2);
            uiElement.rotation = new Rotator(0, 90, 0);
        }

        gameObject.addUI(uiElement);

        autoRoller.getUI().setOwningObjectForUpdate(gameObject, uiElement);
    }
}

refObject.onCreated.add((obj) => {
    new Phases(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new Phases(refObject);
}
