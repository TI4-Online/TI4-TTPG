const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRoller } = require("../roller/auto-roller");
const { GameSetup } = require("../../setup/game-setup/game-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const { TabMap } = require("./tab-map");
const { TabStatus } = require("./tab-status");
const { TabStrategy } = require("./tab-strategy");
const { TurnOrderPanel } = require("../../lib/ui/turn-order-panel");
const {
    Border,
    GameObject,
    LayoutBox,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    Rotator,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");

class Phases {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._gameObject = gameObject;

        const w = 450;
        this._layoutBox = new LayoutBox()
            .setMaximumWidth(w)
            .setMinimumWidth(w)
            .setMinimumHeight(60)
            .setPadding(5, 5, 5, 5);

        this._uiElement = new UIElement();
        this._uiElement.anchorY = 0;
        this._uiElement.position = new Vector(0, 0, 5);
        this._uiElement.widget = new Border().setChild(this._layoutBox);

        if (ObjectNamespace.getNsid(gameObject) === "mat:base/strategy_card") {
            this._uiElement.position = new Vector(0, 15, 2);
            this._uiElement.rotation = new Rotator(0, 90, 0);
        }

        this._update();
        gameObject.addUI(this._uiElement);

        globalEvents.TI4.onGameSetup.add((config, player) => {
            this._update();
        });
    }

    _update() {
        if (world.TI4.config.timestamp <= 0) {
            const gameSetup = new GameSetup();
            this._layoutBox.setChild(gameSetup.getUI());
        } else {
            const tabMap = new TabMap(this._gameObject, this._uiElement);
            const tabStrategy = new TabStrategy();
            const autoRoller = new AutoRoller();
            const tabStatus = new TabStatus();

            autoRoller
                .getUI()
                .setOwningObjectForUpdate(this._gameObject, this._uiElement);

            const tabbedPanel = new TabbedPanel(true)
                .addTab(locale("ui.tab.map"), tabMap.getUI())
                .addTab(locale("ui.tab.strategy_phase"), tabStrategy.getUI())
                .addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())
                .addTab(locale("ui.tab.status_phase"), tabStatus.getUI())
                .addTab(
                    locale("ui.tab.agenda_phase"),
                    new Text().setText("< work in progress >")
                );

            const turnOrderPanel = new TurnOrderPanel();
            const overall = new VerticalBox()
                .addChild(turnOrderPanel)
                .addChild(tabbedPanel);

            this._layoutBox.setChild(overall);
        }
    }
}

refObject.onCreated.add((obj) => {
    new Phases(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new Phases(refObject);
}
